"use client";

import { useCallback, useState } from "react";
import { diasRestantes, formatarData, tamanhoLegivel, urlFoto, type GaleriaDetalhe } from "@/lib/galeria";
import { IconeDownload, IconeRelogio } from "../Icones";
import { Visualizador } from "../galeria/Visualizador";

/** Fotos tratadas: download individual ou ZIP, com o prazo sempre visível. */
export function GaleriaEntregue({ detalhe }: { detalhe: GaleriaDetalhe }) {
  const finais = detalhe.finais;
  const g = detalhe.resumo.id;
  const dias = diasRestantes(detalhe.resumo.expiraEm) ?? 0;
  const tamanhoTotal = finais.reduce((s, f) => s + f.tamanhoBytes, 0);
  const [aberta, setAberta] = useState<number | null>(null);
  const navegar = useCallback(
    (p: number) => setAberta((i) => (i === null ? i : (i + p + finais.length) % finais.length)),
    [finais.length],
  );
  const fechar = useCallback(() => setAberta(null), []);
  const atual = aberta !== null ? finais[aberta] : null;
  const urgente = dias <= 7;

  return (
    <>
      <div className={`flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between ${urgente ? "bg-red-50" : "bg-agua/40"}`}>
        <div className="text-sm">
          <p className={`flex items-center gap-2 font-medium ${urgente ? "text-red-700" : "text-grafite"}`}>
            <IconeRelogio className="size-5" />
            {dias === 0 ? "Último dia para baixar!" : `Faltam ${dias} ${dias === 1 ? "dia" : "dias"} para baixar`}
          </p>
          <p className="mt-1 text-texto-suave">
            As fotos ficam disponíveis até <strong>{formatarData(detalhe.resumo.expiraEm)}</strong> e depois são excluídas.
            Baixe e guarde um backup.
          </p>
        </div>
        {/* Link direto: o navegador baixa em streaming, sem carregar tudo na memória */}
        <a href={`/api/cliente/galerias/${g}/download.zip`} className="botao-primario shrink-0" download>
          <IconeDownload className="size-5" /> Baixar todas ({tamanhoLegivel(tamanhoTotal)})
        </a>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {finais.map((f, i) => (
          <li key={f.id} className="overflow-hidden rounded-xl border border-borda bg-white">
            <button type="button" onClick={() => setAberta(i)} className="block aspect-square w-full overflow-hidden" aria-label={`Ver ${f.nomeOriginal}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada (cookie) */}
              <img src={urlFoto("cliente", g, f.id, "miniatura")} alt={f.nomeOriginal} loading="lazy" className="h-full w-full object-cover" />
            </button>
            <a
              href={urlFoto("cliente", g, f.id, "download")}
              download
              className="flex min-h-11 items-center justify-between gap-2 px-3 text-xs text-texto-suave hover:text-destaque"
            >
              <span className="truncate">{f.nomeOriginal}</span>
              <IconeDownload className="size-5 shrink-0" />
            </a>
          </li>
        ))}
      </ul>

      {atual && (
        <Visualizador
          aberto
          src={urlFoto("cliente", g, atual.id, "previa")}
          legenda={atual.nomeOriginal}
          posicao={aberta ?? 0}
          total={finais.length}
          aoFechar={fechar}
          aoNavegar={navegar}
          acoes={
            <a href={urlFoto("cliente", g, atual.id, "download")} download className="botao mx-auto flex max-w-xs bg-white text-grafite">
              <IconeDownload className="size-5" /> Baixar esta foto ({tamanhoLegivel(atual.tamanhoBytes)})
            </a>
          }
        />
      )}
    </>
  );
}
