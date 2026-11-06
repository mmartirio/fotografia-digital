import { useRef, type TouchEvent } from "react";

/**
 * Gesto de deslizar na horizontal (celular), sem biblioteca de animação.
 * Passo +1 = deslizou para a esquerda (próximo); -1 = para a direita (anterior).
 * Ignora gestos mais verticais que horizontais (rolagem da página).
 */
export function useDeslizar(aoDeslizar: (passo: 1 | -1) => void, limite = 50) {
  const inicio = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      inicio.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: TouchEvent) => {
      const i = inicio.current;
      inicio.current = null;
      if (!i) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - i.x;
      const dy = t.clientY - i.y;
      if (Math.abs(dx) < limite || Math.abs(dx) < Math.abs(dy)) return;
      aoDeslizar(dx < 0 ? 1 : -1);
    },
  };
}
