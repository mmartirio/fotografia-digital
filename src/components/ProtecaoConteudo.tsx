"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Dificulta copiar as fotos: bloqueia "Salvar imagem" (clique direito / toque longo),
 * arrastar imagens e os atalhos Ctrl/⌘+S e Ctrl/⌘+P. A impressão é anulada via CSS
 * (globals.css → @media print). Não impede prints de tela: a proteção de fato das
 * prévias é a marca d'água.
 */
export function ProtecaoConteudo({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const avisar = (texto: string) => {
      setAviso(texto);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setAviso(null), 2500);
    };

    const ehImagem = (alvo: EventTarget | null) => {
      const el = alvo as HTMLElement | null;
      return !!el && (el.tagName === "IMG" || el.tagName === "PICTURE" || !!el.closest("[data-foto]"));
    };

    const menu = (e: MouseEvent) => {
      if (ehImagem(e.target)) {
        e.preventDefault();
        avisar("As fotos são protegidas por direitos autorais.");
      }
    };
    const arrastar = (e: DragEvent) => {
      if (ehImagem(e.target)) e.preventDefault();
    };
    const teclas = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tecla = e.key.toLowerCase();
      if (tecla === "s" || tecla === "p") {
        e.preventDefault();
        avisar(tecla === "p" ? "A impressão está desativada neste site." : "O download do site está desativado.");
      }
    };

    document.addEventListener("contextmenu", menu);
    document.addEventListener("dragstart", arrastar);
    document.addEventListener("keydown", teclas);
    return () => {
      document.removeEventListener("contextmenu", menu);
      document.removeEventListener("dragstart", arrastar);
      document.removeEventListener("keydown", teclas);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div data-protegido>
      {children}
      {aviso && (
        <div
          key={aviso}
          role="status"
          className="anim-aviso fixed inset-x-4 bottom-24 z-[80] mx-auto max-w-sm rounded-2xl bg-grafite px-5 py-3 text-center text-sm text-white shadow-lg"
        >
          {aviso}
        </div>
      )}
    </div>
  );
}
