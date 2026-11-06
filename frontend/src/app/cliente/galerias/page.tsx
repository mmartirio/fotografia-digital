import Link from "next/link";
import { redirect } from "next/navigation";
import { SeloStatus } from "@/components/galeria/SeloStatus";
import { IconeRelogio } from "@/components/Icones";
import { apiServidor } from "@/lib/api-servidor";
import { diasRestantes, formatarData, urlFoto, type GaleriaResumo } from "@/lib/galeria";

function chamada(g: GaleriaResumo): string {
  switch (g.status) {
    case "AGUARDANDO_SELECAO":
      return "Escolha suas fotos favoritas";
    case "SELECAO_ENVIADA":
    case "EM_TRATAMENTO":
      return "Suas fotos estão sendo tratadas";
    case "ENTREGUE":
      return "Fotos prontas para download";
    default:
      return "Galeria encerrada";
  }
}

export default async function MinhasGalerias() {
  const { status, dados } = await apiServidor<GaleriaResumo[]>("/api/cliente/galerias");
  if (status === 401) redirect("/cliente");
  const galerias = dados ?? [];

  return (
    <main className="container-site py-8 md:py-12">
      <p className="etiqueta">Área do cliente</p>
      <h1 className="mt-2 text-3xl md:text-4xl">Minhas galerias</h1>

      {galerias.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-borda bg-white p-8 text-center text-texto-suave">
          Nenhuma galeria disponível ainda. Você receberá um e-mail assim que suas fotos estiverem prontas.
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {galerias.map((g) => {
            const dias = g.status === "ENTREGUE" ? diasRestantes(g.expiraEm) : null;
            return (
              <li key={g.id}>
                <Link
                  href={`/cliente/galerias/${g.id}`}
                  className="group block overflow-hidden rounded-xl border border-borda bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <div className="relative aspect-[4/3] bg-superficie">
                    {g.capaFotoId && g.status !== "EXPIRADA" && (
                      // eslint-disable-next-line @next/next/no-img-element -- imagem privada (cookie)
                      <img
                        src={urlFoto("cliente", g.id, g.capaFotoId, "miniatura")}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <SeloStatus status={g.status} className="absolute left-3 top-3" />
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl">{g.titulo}</h2>
                    <p className="mt-1 text-sm text-texto-suave">{chamada(g)}</p>
                    {dias !== null && (
                      <p className={`mt-3 flex items-center gap-2 text-sm ${dias <= 7 ? "text-red-600" : "text-texto-suave"}`}>
                        <IconeRelogio className="size-4" /> Disponível até {formatarData(g.expiraEm)} ({dias} dias)
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
