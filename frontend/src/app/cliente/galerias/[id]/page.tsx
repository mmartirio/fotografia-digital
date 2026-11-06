import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GaleriaEntregue } from "@/components/cliente/GaleriaEntregue";
import { SelecaoFotos } from "@/components/cliente/SelecaoFotos";
import { SelecaoEnviada } from "@/components/cliente/SelecaoEnviada";
import { SeloStatus } from "@/components/galeria/SeloStatus";
import { IconeSeta } from "@/components/Icones";
import { apiServidor } from "@/lib/api-servidor";
import type { GaleriaDetalhe } from "@/lib/galeria";

export default async function PaginaGaleria({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, dados } = await apiServidor<GaleriaDetalhe>(`/api/cliente/galerias/${id}`);
  if (status === 401) redirect("/cliente");
  if (!dados) notFound();
  const { resumo } = dados;

  return (
    <main className="container-site py-6 md:py-10">
      <Link href="/cliente/galerias" className="inline-flex min-h-11 items-center gap-1 text-sm text-texto-suave hover:text-destaque">
        <IconeSeta direcao="esquerda" className="size-4" /> Minhas galerias
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl md:text-4xl">{resumo.titulo}</h1>
        <SeloStatus status={resumo.status} />
      </div>

      <div className="mt-6">
        {resumo.status === "AGUARDANDO_SELECAO" && <SelecaoFotos detalhe={dados} />}
        {(resumo.status === "SELECAO_ENVIADA" || resumo.status === "EM_TRATAMENTO") && <SelecaoEnviada detalhe={dados} />}
        {resumo.status === "ENTREGUE" && <GaleriaEntregue detalhe={dados} />}
        {resumo.status === "EXPIRADA" && (
          <div className="rounded-xl border border-borda bg-white p-8 text-center text-texto-suave">
            O prazo de download desta galeria terminou e os arquivos foram excluídos. Se precisar das fotos, fale com o Davi.
          </div>
        )}
      </div>
    </main>
  );
}
