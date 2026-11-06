"use client";

import { useEffect } from "react";

/** Um único IntersectionObserver para todos os blocos <Revelar> da página. */
export function ObservadorRevelar() {
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("revelado");
            observador.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    document.querySelectorAll(".revelar:not(.revelado)").forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, []);
  return null;
}
