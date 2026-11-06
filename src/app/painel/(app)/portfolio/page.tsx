import type { Metadata } from "next";
import { PortfolioPainel } from "@/components/painel/PortfolioPainel";
import { obterConteudo } from "@/conteudo/obter";
import { listarPortfolio } from "@/servidor/conteudo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Portfólio" };

export default async function PortfolioPagina() {
  const [fotos, conteudo] = await Promise.all([listarPortfolio(), obterConteudo()]);
  return <PortfolioPainel fotos={fotos} categorias={conteudo.portfolio.categorias} />;
}
