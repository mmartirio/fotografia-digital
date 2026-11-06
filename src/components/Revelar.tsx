"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/*
 * Revela o conteúdo ao entrar na tela (fade + leve subida) com CSS puro.
 * Um único IntersectionObserver compartilhado em vez de um componente animado por
 * bloco: muito menos JavaScript no celular (melhor nota no PageSpeed).
 * O efeito visual é o mesmo; quem pede menos movimento no sistema não vê a animação.
 */

let observador: IntersectionObserver | null = null;
function obs(): IntersectionObserver {
  if (!observador) {
    observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("revelado");
            observador!.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
  }
  return observador;
}

export function Revelar({
  children,
  atraso = 0,
  className = "",
  deslocamento = 28,
}: {
  children: ReactNode;
  atraso?: number;
  className?: string;
  deslocamento?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = obs();
    o.observe(el);
    return () => o.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      className={`revelar ${className}`}
      style={{ "--revelar-atraso": `${atraso}s`, "--revelar-y": `${deslocamento}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}
