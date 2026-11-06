"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { IconeFechar, IconeSeta } from "../Icones";

/**
 * Visualizador em tela cheia: teclado (setas/Esc), deslizar no celular e
 * espaço para ações (selecionar, baixar) no rodapé.
 */
export function Visualizador({
  aberto,
  src,
  legenda,
  posicao,
  total,
  aoFechar,
  aoNavegar,
  acoes,
}: {
  aberto: boolean;
  src: string;
  legenda?: string;
  posicao: number;
  total: number;
  aoFechar: () => void;
  aoNavegar: (passo: number) => void;
  acoes?: ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") aoFechar();
      if (e.key === "ArrowRight") aoNavegar(1);
      if (e.key === "ArrowLeft") aoNavegar(-1);
    };
    window.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [aberto, aoFechar, aoNavegar]);

  const aoArrastar = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) aoNavegar(1);
    else if (info.offset.x > 60) aoNavegar(-1);
  };

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex h-14 shrink-0 items-center justify-between px-3">
            <p className="truncate px-2 text-sm text-white/70">
              {posicao + 1}/{total}
              {legenda ? ` · ${legenda}` : ""}
            </p>
            <button
              type="button"
              aria-label="Fechar"
              onClick={aoFechar}
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <IconeFechar />
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <motion.div
              key={src}
              className="absolute inset-0 touch-pan-y px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={aoArrastar}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada (cookie), sem otimizador */}
              <img
                src={src}
                alt={legenda ?? ""}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="pointer-events-none h-full w-full select-none object-contain"
              />
            </motion.div>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => aoNavegar(-1)}
              className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 md:inline-flex"
            >
              <IconeSeta direcao="esquerda" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={() => aoNavegar(1)}
              className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 md:inline-flex"
            >
              <IconeSeta direcao="direita" />
            </button>
          </div>

          {acoes && <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{acoes}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
