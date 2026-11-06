import { sql } from "./db";
import { excluirImagem } from "./armazenamento";

/** Seções editáveis no painel (o menu/nav é fixo no código). */
export const SECOES = new Set([
  "aparencia",
  "geral",
  "hero",
  "sobre",
  "portfolio",
  "servicos",
  "comoFunciona",
  "depoimentos",
  "faq",
  "orcamento",
  "ctaFinal",
  "rodape",
  "contato",
  "seo",
]);
const TAMANHO_MAXIMO = 100_000;

export class ErroConteudo extends Error {
  constructor(
    mensagem: string,
    public status = 409,
  ) {
    super(mensagem);
  }
}

export async function secoesSalvas(): Promise<Record<string, Record<string, unknown>>> {
  const linhas = await sql<{ chave: string; conteudo: Record<string, unknown> | string }>("SELECT chave, conteudo FROM conteudo_secao");
  const saida: Record<string, Record<string, unknown>> = {};
  for (const l of linhas) {
    if (!SECOES.has(l.chave)) continue;
    saida[l.chave] = typeof l.conteudo === "string" ? JSON.parse(l.conteudo) : l.conteudo;
  }
  return saida;
}

export async function salvarSecao(chave: string, conteudo: unknown) {
  if (!SECOES.has(chave)) throw new ErroConteudo("Seção desconhecida.", 404);
  if (!conteudo || typeof conteudo !== "object" || Array.isArray(conteudo)) throw new ErroConteudo("O conteúdo deve ser um objeto.");
  const texto = JSON.stringify(conteudo);
  if (texto.length > TAMANHO_MAXIMO) throw new ErroConteudo("Conteúdo muito grande.");
  await sql(
    `INSERT INTO conteudo_secao (chave, conteudo, atualizado_em) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (chave) DO UPDATE SET conteudo = EXCLUDED.conteudo, atualizado_em = now()`,
    [chave, texto],
  );
}

export async function restaurarSecao(chave: string) {
  if (!SECOES.has(chave)) throw new ErroConteudo("Seção desconhecida.", 404);
  await sql("DELETE FROM conteudo_secao WHERE chave = $1", [chave]);
}

// ---- portfólio ---------------------------------------------------------------------------

export type FotoPortfolio = {
  id: string;
  src: string;
  miniatura: string;
  largura: number;
  altura: number;
  alt: string;
  categoria: string;
  destaque: boolean;
  ordem: number;
};

const limpar = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

export async function listarPortfolio(): Promise<FotoPortfolio[]> {
  return sql<FotoPortfolio>(
    "SELECT id, src, miniatura, largura, altura, alt, categoria, destaque, ordem FROM foto_portfolio ORDER BY ordem, criado_em",
  );
}

export async function adicionarFoto(f: Omit<FotoPortfolio, "id" | "ordem" | "destaque">): Promise<FotoPortfolio> {
  const [nova] = await sql<FotoPortfolio>(
    `INSERT INTO foto_portfolio (src, miniatura, largura, altura, alt, categoria, ordem)
     VALUES ($1, $2, $3, $4, $5, $6, (SELECT coalesce(max(ordem), 0) + 1 FROM foto_portfolio))
     RETURNING id, src, miniatura, largura, altura, alt, categoria, destaque, ordem`,
    [f.src, f.miniatura, f.largura, f.altura, limpar(f.alt, 200), limpar(f.categoria, 80)],
  );
  return nova;
}

export async function editarFoto(id: string, d: { categoria?: unknown; alt?: unknown; destaque?: unknown }): Promise<FotoPortfolio> {
  const [f] = await sql<FotoPortfolio>(
    `UPDATE foto_portfolio SET categoria = $2, alt = $3, destaque = $4 WHERE id = $1
     RETURNING id, src, miniatura, largura, altura, alt, categoria, destaque, ordem`,
    [id, limpar(d.categoria, 80), limpar(d.alt, 200), d.destaque === true],
  );
  if (!f) throw new ErroConteudo("Foto não encontrada.", 404);
  return f;
}

export async function ordenarPortfolio(ids: unknown) {
  if (!Array.isArray(ids)) throw new ErroConteudo("Lista inválida.", 400);
  let ordem = 1;
  for (const id of ids) {
    if (typeof id === "string") await sql("UPDATE foto_portfolio SET ordem = $2 WHERE id = $1", [id, ordem++]);
  }
}

export async function excluirFoto(id: string) {
  const [f] = await sql<FotoPortfolio>("DELETE FROM foto_portfolio WHERE id = $1 RETURNING src, miniatura", [id]);
  if (!f) throw new ErroConteudo("Foto não encontrada.", 404);
  await excluirImagem(f.src);
  await excluirImagem(f.miniatura);
}
