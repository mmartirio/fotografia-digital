"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { urlFoto, type FotoDto, type GaleriaDetalhe } from "@/lib/galeria";
import { IconeCoracao, IconeComentario } from "../Icones";
import { Visualizador } from "../galeria/Visualizador";
import { JanelaPedido } from "./PedidoEdicao";

export function SelecaoFotos({ detalhe }: { detalhe: GaleriaDetalhe }) {
  const router = useRouter();
  const galeriaId = detalhe.resumo.id;
  const limite = detalhe.resumo.limiteFotos;
  const [fotos, setFotos] = useState<FotoDto[]>(detalhe.originais);
  const [filtro, setFiltro] = useState<"todas" | "selecionadas">("todas");
  const [aberta, setAberta] = useState<number | null>(null);
  const [pedidoDe, setPedidoDe] = useState<string | null>(null); // id da foto com a janela de pedido aberta
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const visiveis = useMemo(() => (filtro === "todas" ? fotos : fotos.filter((f) => f.selecionada)), [fotos, filtro]);
  const selecionadas = fotos.filter((f) => f.selecionada);
  const total = selecionadas.length;
  const comPedido = selecionadas.filter((f) => f.comentario).length;
  const extras = limite ? Math.max(0, total - limite) : 0;
  const atual = aberta !== null ? visiveis[aberta] : null;
  const fotoPedido = pedidoDe ? fotos.find((f) => f.id === pedidoDe) ?? null : null;

  const salvar = useCallback(
    async (foto: FotoDto, mudanca: Partial<Pick<FotoDto, "selecionada" | "comentario">>) => {
      const nova = { ...foto, ...mudanca };
      setFotos((fs) => fs.map((f) => (f.id === foto.id ? nova : f))); // otimista
      try {
        await api(`/api/cliente/galerias/${galeriaId}/fotos/${foto.id}/selecao`, {
          method: "PUT",
          json: { selecionada: nova.selecionada, comentario: nova.comentario },
        });
      } catch (e) {
        setFotos((fs) => fs.map((f) => (f.id === foto.id ? foto : f)));
        setAviso(e instanceof Error ? e.message : "Não foi possível salvar.");
      }
    },
    [galeriaId],
  );

  const navegar = useCallback(
    (passo: number) => setAberta((i) => (i === null || visiveis.length === 0 ? i : (i + passo + visiveis.length) % visiveis.length)),
    [visiveis.length],
  );
  const fechar = useCallback(() => setAberta(null), []);

  return (
    <>
      <div className="rounded-2xl border border-borda bg-white p-4 text-sm sm:p-5">
        <ol className="flex flex-col gap-1.5">
          <li>
            <strong>1.</strong> Toque no <IconeCoracao cheio className="inline size-4 text-red-500" /> para escolher suas favoritas.
          </li>
          <li>
            <strong>2.</strong> Em cada foto escolhida, use <strong>✏️ Pedido de edição</strong> para pedir ajustes (ex.: remover uma
            mancha no rosto, diminuir um pouco o quadril).
          </li>
          <li>
            <strong>3.</strong> Quando terminar, toque em <strong>Enviar seleção</strong>.
          </li>
        </ol>
        {limite && (
          <p className="mt-3 text-texto-suave">
            Seu pacote inclui <strong className="text-texto">{limite} fotos</strong>. Fotos extras podem ser escolhidas e o valor é
            combinado com o Davi.
          </p>
        )}
      </div>

      {/* Filtro */}
      <div className="mt-5 flex gap-2" role="tablist">
        {(["todas", "selecionadas"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filtro === f}
            onClick={() => setFiltro(f)}
            className={`min-h-11 rounded-full border px-5 text-sm ${
              filtro === f ? "border-destaque bg-destaque text-white" : "border-borda bg-white text-texto-suave"
            }`}
          >
            {f === "todas" ? `Todas (${fotos.length})` : `Selecionadas (${total})`}
          </button>
        ))}
      </div>

      {/* Grade */}
      {visiveis.length === 0 ? (
        <p className="mt-8 text-center text-texto-suave">Nenhuma foto selecionada ainda.</p>
      ) : (
        <ul className="mt-5 columns-2 gap-3 pb-28 md:columns-3 lg:columns-4">
          {visiveis.map((f, i) => (
            <li key={f.id} className="mb-3 break-inside-avoid">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAberta(i)}
                  className={`block w-full overflow-hidden rounded-xl ring-offset-2 transition ${f.selecionada ? "ring-3 ring-destaque" : ""}`}
                  aria-label={`Ampliar ${f.nomeOriginal}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada (cookie) */}
                  <img
                    src={urlFoto("cliente", galeriaId, f.id, "miniatura")}
                    alt={f.nomeOriginal}
                    loading="lazy"
                    width={f.largura ?? undefined}
                    height={f.altura ?? undefined}
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-auto w-full select-none"
                  />
                </button>
                <button
                  type="button"
                  aria-pressed={f.selecionada}
                  aria-label={f.selecionada ? "Remover da seleção" : "Selecionar foto"}
                  onClick={() => salvar(f, { selecionada: !f.selecionada })}
                  className="absolute bottom-2 right-2 inline-flex size-11 items-center justify-center rounded-full bg-white/90 shadow transition-transform active:scale-90"
                >
                  <IconeCoracao cheio={f.selecionada} className={`size-6 ${f.selecionada ? "text-red-500" : "text-grafite"}`} />
                </button>
              </div>

              {/* Área de pedido: liberada assim que a foto é selecionada */}
              <AnimatePresence initial={false}>
                {f.selecionada && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={() => setPedidoDe(f.id)}
                    className={`mt-1.5 flex w-full items-start gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left text-xs ${
                      f.comentario ? "border-destaque/40 bg-agua/30 text-grafite" : "border-dashed border-destaque/50 bg-white text-destaque"
                    }`}
                  >
                    <IconeComentario className="mt-px size-4 shrink-0" />
                    <span className="line-clamp-2">{f.comentario ? f.comentario : "Pedido de edição"}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      )}

      {/* Barra fixa de envio */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-white/95 backdrop-blur-md">
        <div className="container-site flex items-center justify-between gap-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="text-sm">
            <p className="font-medium">
              {total} {total === 1 ? "foto selecionada" : "fotos selecionadas"}
              {limite ? <span className="text-texto-suave"> de {limite}</span> : null}
            </p>
            <p className="text-xs text-texto-suave">
              {comPedido > 0 && `${comPedido} com pedido de edição`}
              {comPedido > 0 && extras > 0 && " · "}
              {extras > 0 && <span className="text-amber-700">{extras} extra(s) além do pacote</span>}
            </p>
          </div>
          <button type="button" disabled={total === 0} onClick={() => setConfirmando(true)} className="botao-primario disabled:opacity-50">
            Enviar seleção
          </button>
        </div>
      </div>

      {/* Visualizador */}
      {atual && (
        <Visualizador
          aberto
          src={urlFoto("cliente", galeriaId, atual.id, "previa")}
          legenda={atual.nomeOriginal}
          posicao={aberta ?? 0}
          total={visiveis.length}
          aoFechar={fechar}
          aoNavegar={navegar}
          acoes={
            <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => salvar(atual, { selecionada: !atual.selecionada })}
                className={`botao min-h-12 shrink-0 ${atual.selecionada ? "bg-red-500 text-white" : "bg-white text-grafite"}`}
              >
                <IconeCoracao cheio={atual.selecionada} className="size-5" />
                {atual.selecionada ? "Selecionada" : "Selecionar"}
              </button>
              {atual.selecionada ? (
                <button
                  type="button"
                  onClick={() => setPedidoDe(atual.id)}
                  className="flex min-h-12 flex-1 items-center gap-2 rounded-full border border-white/25 px-5 text-left text-sm text-white hover:border-agua"
                >
                  <IconeComentario className="size-5 shrink-0" />
                  <span className="line-clamp-1">{atual.comentario ? atual.comentario : "Adicionar pedido de edição"}</span>
                </button>
              ) : (
                <p className="flex-1 text-center text-xs text-white/60 sm:text-left">Selecione a foto para poder pedir ajustes nela.</p>
              )}
            </div>
          }
        />
      )}

      {/* Pedido de edição */}
      <JanelaPedido
        aberta={fotoPedido !== null}
        miniatura={fotoPedido ? urlFoto("cliente", galeriaId, fotoPedido.id, "miniatura") : ""}
        nome={fotoPedido?.nomeOriginal ?? ""}
        valorInicial={fotoPedido?.comentario ?? ""}
        aoSalvar={(texto) => (fotoPedido ? salvar(fotoPedido, { comentario: texto || null }) : undefined)}
        aoFechar={() => setPedidoDe(null)}
      />

      {/* Confirmação de envio */}
      <AnimatePresence>
        {confirmando && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmando(false)}
          >
            <motion.form
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={async (e) => {
                e.preventDefault();
                const observacao = String(new FormData(e.currentTarget).get("observacao") ?? "");
                try {
                  await api(`/api/cliente/galerias/${galeriaId}/enviar-selecao`, { method: "POST", json: { observacao } });
                  setConfirmando(false);
                  router.refresh();
                } catch (err) {
                  setAviso(err instanceof Error ? err.message : "Não foi possível enviar.");
                }
              }}
              className="w-full max-w-lg rounded-t-xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-xl"
            >
              <h2 className="text-2xl">Enviar seleção?</h2>
              <p className="mt-2 text-sm text-texto-suave">
                Você escolheu <strong className="text-texto">{total} fotos</strong>
                {extras > 0 ? ` (${extras} além do pacote)` : ""}
                {comPedido > 0 ? `, ${comPedido} com pedido de edição` : ""}. Depois de enviar, a seleção e os pedidos não poderão ser
                alterados.
              </p>
              <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
                Recado geral para o Davi (opcional)
                <textarea
                  name="observacao"
                  rows={3}
                  maxLength={1000}
                  placeholder="Ex.: prefiro um tratamento mais natural em todas"
                  className="rounded-xl border border-borda p-3 text-base font-normal focus:border-destaque focus:outline-none"
                />
              </label>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setConfirmando(false)} className="botao-secundario">
                  Continuar escolhendo
                </button>
                <button type="submit" className="botao-primario">
                  Confirmar envio
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {aviso && (
        <div role="alert" className="fixed inset-x-4 top-20 z-[70] mx-auto max-w-md rounded-xl bg-red-600 p-4 text-sm text-white shadow-lg">
          {aviso}
          <button type="button" className="ml-3 underline" onClick={() => setAviso(null)}>
            OK
          </button>
        </div>
      )}
    </>
  );
}
