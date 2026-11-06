import Link from "next/link";
import { cartao } from "@/components/painel/estilos";
import { SeloStatus } from "@/components/galeria/SeloStatus";
import { apiServidor } from "@/lib/api-servidor";
import { diasRestantes, formatarData, ROTULO_STATUS, type GaleriaResumo, type StatusGaleria } from "@/lib/galeria";

type Resumo = {
  galeriasPorStatus: Record<StatusGaleria, number>;
  leadsNovos: number;
  expirandoEm7Dias: GaleriaResumo[];
  aguardandoTratamento: GaleriaResumo[];
};

export default async function InicioPainel() {
  const { dados } = await apiServidor<Resumo>("/api/painel/resumo");
  if (!dados) return <p>Não foi possível carregar o resumo.</p>;
  const ativos: StatusGaleria[] = ["AGUARDANDO_SELECAO", "SELECAO_ENVIADA", "EM_TRATAMENTO", "ENTREGUE"];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl">Olá! 👋</h1>
      <p className="mt-1 text-texto-suave">Resumo das suas galerias.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {ativos.map((s) => (
          <Link key={s} href="/painel/galerias" className={`${cartao} transition-all hover:shadow-md active:scale-[0.97]`}>
            <p className="font-titulo text-3xl">{dados.galeriasPorStatus[s] ?? 0}</p>
            <p className="text-sm text-texto-suave">{ROTULO_STATUS[s]}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className={cartao}>
          <h2 className="text-xl">Para tratar</h2>
          <p className="text-sm text-texto-suave">Clientes que já enviaram a seleção.</p>
          <ListaCurta galerias={dados.aguardandoTratamento} vazio="Nenhuma seleção pendente." />
        </section>
        <section className={cartao}>
          <h2 className="text-xl">Expirando em 7 dias</h2>
          <p className="text-sm text-texto-suave">Os arquivos serão excluídos após o prazo.</p>
          <ListaCurta galerias={dados.expirandoEm7Dias} vazio="Nenhuma galeria perto de expirar." mostrarPrazo />
        </section>
      </div>

      <Link href="/painel/galerias?nova=1" className="botao-primario mt-8">
        + Nova galeria
      </Link>
    </div>
  );
}

function ListaCurta({ galerias, vazio, mostrarPrazo = false }: { galerias: GaleriaResumo[]; vazio: string; mostrarPrazo?: boolean }) {
  if (galerias.length === 0) return <p className="mt-4 text-sm text-texto-suave">{vazio}</p>;
  return (
    <ul className="mt-3 divide-y divide-borda">
      {galerias.map((g) => (
        <li key={g.id}>
          <Link href={`/painel/galerias/${g.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2 hover:text-destaque">
            <span>
              <span className="block font-medium">{g.titulo}</span>
              <span className="text-xs text-texto-suave">{g.cliente?.nome}</span>
            </span>
            {mostrarPrazo ? (
              <span className="text-sm text-red-600">
                {formatarData(g.expiraEm)} ({diasRestantes(g.expiraEm)}d)
              </span>
            ) : (
              <SeloStatus status={g.status} />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
