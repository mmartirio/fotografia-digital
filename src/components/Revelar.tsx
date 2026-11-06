import type { CSSProperties, ReactNode } from "react";

/*
 * Revela o conteúdo ao entrar na tela (fade + leve subida) com CSS puro.
 * Sem JavaScript por bloco: é só uma <div class="revelar">. Um único observador
 * (ObservadorRevelar, montado uma vez na página) liga a animação de todos os blocos.
 * Quem pede menos movimento no sistema não vê a animação; sem JS, tudo fica visível.
 */
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
  return (
    <div className={`revelar ${className}`} style={{ "--revelar-atraso": `${atraso}s`, "--revelar-y": `${deslocamento}px` } as CSSProperties}>
      {children}
    </div>
  );
}
