import { cache } from "react";
import { backendUrl } from "@/lib/backend";
import { conteudoPadrao } from "./padrao";
import type { ConteudoSite, FotoPortfolio } from "./tipos";

/** Seções editáveis no painel → onde ficam em ConteudoSite. */
export const SECOES_EDITAVEIS = [
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
  "aparencia",
] as const;
export type ChaveSecao = (typeof SECOES_EDITAVEIS)[number];

type FotoPortfolioApi = { src: string; largura: number; altura: number; alt: string; categoria: string };
type RespostaConteudo = { secoes: Partial<Record<ChaveSecao, Record<string, unknown>>>; portfolio: FotoPortfolioApi[] };

/** Valor de uma seção no formato editado pelo painel. */
export function valorSecao(c: ConteudoSite, chave: ChaveSecao): Record<string, unknown> {
  if (chave === "geral") return { marca: c.marca };
  // Rodapé reúne o slogan (campo global) e os textos próprios do rodapé
  if (chave === "rodape") return { slogan: c.slogan, ...c.rodape };
  if (chave === "portfolio") {
    const { fotos: _fotos, ...textos } = c.portfolio; // fotos são geridas na tela Portfólio
    void _fotos;
    return textos;
  }
  return c[chave] as unknown as Record<string, unknown>;
}

/** Aplica as seções salvas sobre o padrão (seção a seção, campo a campo). */
export function mesclar(base: ConteudoSite, secoes: RespostaConteudo["secoes"], fotos: FotoPortfolioApi[]): ConteudoSite {
  const c: ConteudoSite = structuredClone(base);
  for (const chave of SECOES_EDITAVEIS) {
    const salvo = secoes[chave];
    if (!salvo) continue;
    if (chave === "geral") {
      if (typeof salvo.marca === "string") c.marca = salvo.marca;
      if (typeof salvo.slogan === "string") c.slogan = salvo.slogan; // versões antigas
    } else if (chave === "rodape") {
      const { slogan, ...resto } = salvo;
      if (typeof slogan === "string") c.slogan = slogan;
      Object.assign(c.rodape, resto);
    } else {
      Object.assign(c[chave] as object, salvo);
    }
  }
  if (fotos.length > 0) {
    c.portfolio.fotos = fotos.map<FotoPortfolio>((f) => ({
      src: f.src,
      largura: f.largura,
      altura: f.altura,
      alt: f.alt,
      categoria: f.categoria,
    }));
  }
  return c;
}

/**
 * Conteúdo da landing: padrão do código + o que o fotógrafo salvou no painel.
 * Se o backend estiver fora do ar, o site continua no ar com o padrão.
 */
export const obterConteudo = cache(async function obterConteudo(): Promise<ConteudoSite> {
  try {
    const resp = await fetch(backendUrl("/api/publico/conteudo"), { cache: "no-store" });
    if (!resp.ok) return conteudoPadrao;
    const dados = (await resp.json()) as RespostaConteudo;
    return mesclar(conteudoPadrao, dados.secoes ?? {}, dados.portfolio ?? []);
  } catch {
    return conteudoPadrao;
  }
});
