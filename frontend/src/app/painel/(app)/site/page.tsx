import type { Metadata } from "next";
import { EditorConteudo } from "@/components/painel/EditorConteudo";
import { obterConteudo, SECOES_EDITAVEIS, valorSecao, type ChaveSecao } from "@/conteudo/obter";
import { conteudoPadrao } from "@/conteudo/padrao";
import { apiServidor } from "@/lib/api-servidor";

export const metadata: Metadata = { title: "Editar site" };

export default async function TextosDoSite({ searchParams }: { searchParams: Promise<{ secao?: string }> }) {
  const { secao } = await searchParams;
  const [conteudo, { dados: salvas }] = await Promise.all([obterConteudo(), apiServidor<Record<string, unknown>>("/api/painel/conteudo")]);
  const valores = Object.fromEntries(SECOES_EDITAVEIS.map((k) => [k, valorSecao(conteudo, k)])) as Record<ChaveSecao, Record<string, unknown>>;
  const padroes = Object.fromEntries(SECOES_EDITAVEIS.map((k) => [k, valorSecao(conteudoPadrao, k)])) as Record<ChaveSecao, Record<string, unknown>>;
  const inicial = (SECOES_EDITAVEIS as readonly string[]).includes(secao ?? "") ? (secao as ChaveSecao) : "hero";
  return <EditorConteudo valores={valores} padroes={padroes} personalizadas={Object.keys(salvas ?? {})} inicial={inicial} />;
}
