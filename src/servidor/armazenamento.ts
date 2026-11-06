import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Arquivos de imagem enviados pelo painel.
 * - Produção (Netlify): Netlify Blobs, store "imagens" (sem configuração: o Netlify injeta o acesso).
 * - Desenvolvimento/CI: disco local em .dados/imagens (ou ARMAZENAMENTO_DIR).
 * Nos dois casos a URL pública é /imagens/<pasta>/<uuid>.<ext>, servida por src/app/imagens/[...chave].
 * As imagens chegam já redimensionadas pelo navegador (limite de ~6 MB por requisição nas funções do Netlify).
 */

const STORE = "imagens";
const PREFIXO_URL = "/imagens/";
const CHAVE_VALIDA = /^(site|portfolio)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;
const TIPO_POR_EXTENSAO: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Netlify Blobs disponível (função rodando no Netlify ou `netlify dev`). */
function usaNetlifyBlobs(): boolean {
  return Boolean((globalThis as { netlifyBlobsContext?: string }).netlifyBlobsContext || process.env.NETLIFY_BLOBS_CONTEXT);
}

async function store() {
  const { getStore } = await import("@netlify/blobs");
  // "strong": a foto aparece logo após o envio, sem esperar a propagação na CDN
  return getStore({ name: STORE, consistency: "strong" });
}

function pastaLocal() {
  return path.resolve(process.env.ARMAZENAMENTO_DIR || ".dados/imagens");
}

/** Chave interna a partir da URL pública (null se não for uma imagem nossa). */
export function chaveDaUrl(url: string): string | null {
  if (!url.startsWith(PREFIXO_URL)) return null;
  const chave = url.slice(PREFIXO_URL.length);
  return CHAVE_VALIDA.test(chave) ? chave : null;
}

export const TAMANHO_MAXIMO = 4 * 1024 * 1024;
const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export class ArquivoInvalido extends Error {}

/** Confere tipo declarado, tamanho e a "assinatura" real dos bytes (não confia só na extensão). */
export async function validarImagem(arquivo: File): Promise<{ bytes: Buffer; extensao: string; tipo: string }> {
  const extensao = TIPOS[arquivo.type];
  if (!extensao) throw new ArquivoInvalido("Formato não suportado. Envie JPG, PNG ou WebP.");
  if (arquivo.size > TAMANHO_MAXIMO) throw new ArquivoInvalido("Imagem grande demais (máximo 4 MB após o redimensionamento).");
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  const confere = (extensao === "jpg" && jpeg) || (extensao === "png" && png) || (extensao === "webp" && webp);
  if (!confere) throw new ArquivoInvalido("O arquivo não é uma imagem válida.");
  return { bytes, extensao, tipo: arquivo.type };
}

/** Largura × altura lidas do cabeçalho do arquivo (JPEG, PNG ou WebP), sem bibliotecas nativas. */
export function dimensoes(b: Buffer): { largura: number; altura: number } {
  if (b[0] === 0x89 && b[1] === 0x50) return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) };
  if (b.subarray(0, 4).toString("ascii") === "RIFF") {
    const tipo = b.subarray(12, 16).toString("ascii");
    if (tipo === "VP8X") return { largura: 1 + b.readUIntLE(24, 3), altura: 1 + b.readUIntLE(27, 3) };
    if (tipo === "VP8L") {
      const v = b.readUInt32LE(21);
      return { largura: 1 + (v & 0x3fff), altura: 1 + ((v >> 14) & 0x3fff) };
    }
    if (tipo === "VP8 ") return { largura: b.readUInt16LE(26) & 0x3fff, altura: b.readUInt16LE(28) & 0x3fff };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marcador = b[i + 1];
      // SOF0..SOF15 (exceto DHT=C4, JPG=C8, DAC=CC) trazem as dimensões
      if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
        return { altura: b.readUInt16BE(i + 5), largura: b.readUInt16BE(i + 7) };
      }
      if (marcador === 0xd8 || marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) {
        i += 2;
        continue;
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  throw new ArquivoInvalido("Não foi possível ler as dimensões da imagem.");
}

/** Valida, salva e devolve URL + dimensões. */
export async function receberImagem(pasta: "site" | "portfolio", arquivo: unknown) {
  if (!(arquivo instanceof File)) throw new ArquivoInvalido("Envie a imagem no campo \"arquivo\".");
  const { bytes, extensao, tipo } = await validarImagem(arquivo);
  const { largura, altura } = dimensoes(bytes);
  if (largura * altura > 40_000_000) throw new ArquivoInvalido("Imagem com resolução grande demais.");
  const src = await salvarImagem(pasta, `${crypto.randomUUID()}.${extensao}`, bytes, tipo);
  return { src, largura, altura };
}

/** Salva e devolve a URL pública. `nome` deve ser único (ex.: UUID). */
export async function salvarImagem(pasta: "site" | "portfolio", nome: string, bytes: Buffer, tipo: string): Promise<string> {
  const chave = `${pasta}/${nome}`;
  if (!CHAVE_VALIDA.test(chave)) throw new ArquivoInvalido("Nome de arquivo inválido.");
  if (usaNetlifyBlobs()) {
    const dados = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    await (await store()).set(chave, dados, { metadata: { tipo } });
  } else {
    const destino = path.join(pastaLocal(), chave);
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.writeFile(destino, bytes);
  }
  return PREFIXO_URL + chave;
}

/** Lê uma imagem pela chave (para a rota /imagens). null se não existir. */
export async function lerImagem(chave: string): Promise<{ bytes: ArrayBuffer | Buffer; tipo: string } | null> {
  if (!CHAVE_VALIDA.test(chave)) return null;
  const tipoPadrao = TIPO_POR_EXTENSAO[chave.split(".").pop()!];
  if (usaNetlifyBlobs()) {
    const r = await (await store()).getWithMetadata(chave, { type: "arrayBuffer" });
    if (!r) return null;
    return { bytes: r.data, tipo: typeof r.metadata?.tipo === "string" ? r.metadata.tipo : tipoPadrao };
  }
  try {
    return { bytes: await fs.readFile(path.join(pastaLocal(), chave)), tipo: tipoPadrao };
  } catch {
    return null;
  }
}

export async function excluirImagem(url: string | null | undefined): Promise<void> {
  const chave = url ? chaveDaUrl(url) : null;
  if (!chave) return; // imagens de exemplo (public/) não são apagadas
  try {
    if (usaNetlifyBlobs()) await (await store()).delete(chave);
    else await fs.unlink(path.join(pastaLocal(), chave));
  } catch {
    // arquivo já removido: nada a fazer
  }
}
