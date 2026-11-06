import { notFound } from "next/navigation";
import { GaleriaPainel } from "@/components/painel/GaleriaPainel";
import { apiServidor } from "@/lib/api-servidor";
import type { GaleriaDetalhe } from "@/lib/galeria";

export default async function DetalheGaleriaPainel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { dados } = await apiServidor<GaleriaDetalhe>(`/api/painel/galerias/${id}`);
  if (!dados) notFound();
  return <GaleriaPainel detalhe={dados} />;
}
