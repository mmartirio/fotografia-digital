"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { formatarData, ROTULO_STATUS, urlFoto, type GaleriaResumo, type StatusGaleria } from "@/lib/galeria";
import { SeloStatus } from "../galeria/SeloStatus";
import { campo, cartao } from "./estilos";

export function ListaGalerias({ galerias, abrirNova }: { galerias: GaleriaResumo[]; abrirNova: boolean }) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(abrirNova);
  const [filtro, setFiltro] = useState<StatusGaleria | "TODAS">("TODAS");
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return galerias.filter(
      (g) =>
        (filtro === "TODAS" || g.status === filtro) &&
        (!termo || `${g.titulo} ${g.cliente?.nome} ${g.cliente?.email}`.toLowerCase().includes(termo)),
    );
  }, [galerias, filtro, busca]);

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setSalvando(true);
    setErro("");
    try {
      const g = await api<GaleriaResumo>("/api/painel/galerias", {
        method: "POST",
        json: { ...d, limiteFotos: d.limiteFotos ? Number(d.limiteFotos) : null, clienteTelefone: d.clienteTelefone || null },
      });
      router.push(`/painel/galerias/${g.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar.");
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Galerias</h1>
        <button type="button" onClick={() => setMostrarForm((v) => !v)} className="botao-primario">
          {mostrarForm ? "Fechar" : "+ Nova galeria"}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={criar} className={`${cartao} mt-5 grid gap-4 sm:grid-cols-2`}>
          <p className="text-sm text-texto-suave sm:col-span-2">
            O cliente acessa pelo e-mail informado. Se ele já tiver outra galeria, ela fica junto na mesma conta.
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Nome do cliente*
            <input name="clienteNome" required maxLength={120} className={campo} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            E-mail do cliente*
            <input name="clienteEmail" type="email" required maxLength={180} className={campo} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            WhatsApp do cliente
            <input name="clienteTelefone" type="tel" maxLength={20} className={campo} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Título da galeria*
            <input name="titulo" required maxLength={150} placeholder="Ex.: Casamento Ana & Pedro" className={campo} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Fotos incluídas no pacote
            <input name="limiteFotos" type="number" min={1} placeholder="Ex.: 30 (vazio = sem limite)" className={campo} />
          </label>
          {erro && <p className="text-sm text-red-600 sm:col-span-2">{erro}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={salvando} className="botao-primario disabled:opacity-60">
              {salvando ? "Criando..." : "Criar e enviar fotos"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente ou título"
          className={`${campo} md:max-w-xs`}
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
          {(["TODAS", "CRIADA", "AGUARDANDO_SELECAO", "SELECAO_ENVIADA", "EM_TRATAMENTO", "ENTREGUE", "EXPIRADA"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFiltro(s)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-xs ${
                filtro === s ? "border-destaque bg-destaque text-white" : "border-borda bg-white text-texto-suave"
              }`}
            >
              {s === "TODAS" ? "Todas" : ROTULO_STATUS[s]}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="mt-10 text-center text-texto-suave">Nenhuma galeria encontrada.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((g) => (
            <li key={g.id}>
              <Link href={`/painel/galerias/${g.id}`} className="flex gap-3 overflow-hidden rounded-xl border border-borda bg-white p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-superficie">
                  {g.capaFotoId && (
                    // eslint-disable-next-line @next/next/no-img-element -- imagem privada (cookie)
                    <img src={urlFoto("painel", g.id, g.capaFotoId, "miniatura")} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{g.titulo}</p>
                  <p className="truncate text-xs text-texto-suave">{g.cliente?.nome}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <SeloStatus status={g.status} />
                    <span className="text-xs text-texto-suave">
                      {g.status === "ENTREGUE" ? `até ${formatarData(g.expiraEm)}` : `${g.totalOriginais} fotos · ${g.selecionadas} escolhidas`}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
