import type { Metadata } from "next";
import { PortfolioPainel, type FotoPortfolioApi } from "@/components/painel/PortfolioPainel";
import { obterConteudo } from "@/conteudo/obter";
import { apiServidor } from "@/lib/api-servidor";

export const metadata: Metadata = { title: "Portfólio" };

export default async function PortfolioPagina() {
  const [{ dados }, conteudo] = await Promise.all([apiServidor<FotoPortfolioApi[]>("/api/painel/portfolio"), obterConteudo()]);
  return <PortfolioPainel fotos={dados ?? []} categorias={conteudo.portfolio.categorias} />;
}
