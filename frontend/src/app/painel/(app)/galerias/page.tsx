import type { Metadata } from "next";
import { ListaGalerias } from "@/components/painel/ListaGalerias";
import { apiServidor } from "@/lib/api-servidor";
import type { GaleriaResumo } from "@/lib/galeria";

export const metadata: Metadata = { title: "Galerias" };

export default async function GaleriasPainel({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const { nova } = await searchParams;
  const { dados } = await apiServidor<GaleriaResumo[]>("/api/painel/galerias");
  return <ListaGalerias galerias={dados ?? []} abrirNova={nova === "1"} />;
}
