"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** Atalhos dos pedidos mais comuns (o cliente pode combinar e complementar). */
export const SUGESTOES_EDICAO = [
  "Remover manchas/espinhas",
  "Suavizar a pele",
  "Afinar cintura/quadril",
  "Clarear a foto",
  "Remover objeto do fundo",
  "Versão em preto e branco",
];

export const LIMITE_PEDIDO = 500;

/** Acrescenta (ou retira, se já estiver) uma sugestão ao texto do pedido. */
export function alternarSugestao(texto: string, sugestao: string): string {
  const partes = texto
    .split(/;\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const nova = partes.includes(sugestao) ? partes.filter((p) => p !== sugestao) : [...partes, sugestao];
  return nova.join("; ").slice(0, LIMITE_PEDIDO);
}

/** Chips de sugestão + campo livre. Reaproveitado na janela e no visualizador. */
export function CamposPedido({
  valor,
  aoMudar,
  escuro = false,
  autoFocar = false,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  escuro?: boolean;
  autoFocar?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SUGESTOES_EDICAO.map((s) => {
          const ativo = valor.split(/;\s*/).includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={ativo}
              onClick={() => aoMudar(alternarSugestao(valor, s))}
              className={`min-h-9 rounded-full border px-3 text-xs transition-colors ${
                ativo
                  ? "border-destaque bg-destaque text-white"
                  : escuro
                    ? "border-white/30 text-white/85 hover:border-agua"
                    : "border-borda bg-white text-texto hover:border-destaque"
              }`}
            >
              {ativo ? "✓ " : "+ "}
              {s}
            </button>
          );
        })}
      </div>
      <div>
        <textarea
          value={valor}
          onChange={(e) => aoMudar(e.target.value.slice(0, LIMITE_PEDIDO))}
          rows={3}
          autoFocus={autoFocar}
          maxLength={LIMITE_PEDIDO}
          placeholder="Descreva o que gostaria de ajustar. Ex.: remover a mancha no rosto, diminuir um pouco o quadril..."
          className={`w-full rounded-xl border p-3 text-base focus:outline-none ${
            escuro
              ? "border-white/20 bg-white/10 text-white placeholder:text-white/45 focus:border-agua"
              : "border-borda bg-white text-texto placeholder:text-texto-suave/70 focus:border-destaque"
          }`}
        />
        <p className={`text-right text-xs ${escuro ? "text-white/50" : "text-texto-suave"}`}>
          {valor.length}/{LIMITE_PEDIDO}
        </p>
      </div>
    </div>
  );
}

/**
 * Janela do pedido de edição de uma foto selecionada.
 * Mobile: sobe de baixo (bottom sheet); desktop: centralizada.
 */
export function JanelaPedido({
  aberta,
  miniatura,
  nome,
  valorInicial,
  aoSalvar,
  aoFechar,
}: {
  aberta: boolean;
  miniatura: string;
  nome: string;
  valorInicial: string;
  aoSalvar: (texto: string) => Promise<void> | void;
  aoFechar: () => void;
}) {
  const [texto, setTexto] = useState(valorInicial);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setTexto(valorInicial), [valorInicial, aberta]);

  return (
    <AnimatePresence>
      {aberta && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={aoFechar}
        >
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-label="Pedido de edição"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              setSalvando(true);
              await aoSalvar(texto.trim());
              setSalvando(false);
              aoFechar();
            }}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-borda sm:hidden" />
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada (cookie) */}
              <img src={miniatura} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
                <h2 className="text-xl">Pedido de edição</h2>
                <p className="truncate text-xs text-texto-suave">{nome}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-texto-suave">Toque nas sugestões ou escreva com suas palavras. O Davi verá o pedido junto com a foto.</p>
            <div className="mt-4">
              <CamposPedido valor={texto} aoMudar={setTexto} />
            </div>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {valorInicial && (
                <button
                  type="button"
                  className="botao text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    setSalvando(true);
                    await aoSalvar("");
                    setSalvando(false);
                    aoFechar();
                  }}
                >
                  Remover pedido
                </button>
              )}
              <button type="button" onClick={aoFechar} className="botao-secundario">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="botao-primario disabled:opacity-60">
                {salvando ? "Salvando..." : "Salvar pedido"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
