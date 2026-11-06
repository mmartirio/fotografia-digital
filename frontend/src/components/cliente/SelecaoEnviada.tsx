"use client";

import { useCallback, useState } from "react";
import { formatarData, urlFoto, type GaleriaDetalhe } from "@/lib/galeria";
import { IconeComentario } from "../Icones";
import { Visualizador } from "../galeria/Visualizador";

/** Seleção já enviada: só leitura, enquanto o Davi trata as fotos. */
export function SelecaoEnviada({ detalhe }: { detalhe: GaleriaDetalhe }) {
  const escolhidas = detalhe.originais.filter((f) => f.selecionada);
  const [aberta, setAberta] = useState<number | null>(null);
  const navegar = useCallback(
    (p: number) => setAberta((i) => (i === null ? i : (i + p + escolhidas.length) % escolhidas.length)),
    [escolhidas.length],
  );
  const fechar = useCallback(() => setAberta(null), []);
  const g = detalhe.resumo.id;
  const atual = aberta !== null ? escolhidas[aberta] : null;

  return (
    <>
      <div className="rounded-xl bg-agua/40 p-5 text-sm">
        <p className="font-medium text-grafite">Seleção recebida em {formatarData(detalhe.resumo.selecaoEnviadaEm)}! 🎉</p>
        <p className="mt-1 text-texto-suave">
          {detalhe.resumo.status === "EM_TRATAMENTO" ? "Suas fotos já estão sendo tratadas." : "Em breve o Davi começa o tratamento."}{" "}
          Você receberá um e-mail quando as fotos finais estiverem prontas para download.
        </p>
      </div>
      <h2 className="mt-8 text-xl">Suas {escolhidas.length} fotos escolhidas</h2>
      <ul className="mt-4 columns-2 gap-3 md:columns-3 lg:columns-4">
        {escolhidas.map((f, i) => (
          <li key={f.id} className="relative mb-3 break-inside-avoid">
            <button type="button" onClick={() => setAberta(i)} className="block w-full overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada (cookie) */}
              <img src={urlFoto("cliente", g, f.id, "miniatura")} alt={f.nomeOriginal} loading="lazy" className="h-auto w-full" />
            </button>
            {f.comentario && (
              <p className="mt-1 flex gap-1 text-xs text-texto-suave">
                <IconeComentario className="size-4 shrink-0" /> Pedido: {f.comentario}
              </p>
            )}
          </li>
        ))}
      </ul>
      {atual && (
        <Visualizador
          aberto
          src={urlFoto("cliente", g, atual.id, "previa")}
          legenda={atual.nomeOriginal}
          posicao={aberta ?? 0}
          total={escolhidas.length}
          aoFechar={fechar}
          aoNavegar={navegar}
        />
      )}
    </>
  );
}
