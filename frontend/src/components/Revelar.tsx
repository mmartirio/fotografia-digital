"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Revela o conteúdo ao entrar na tela (fade + leve subida).
 * Só anima opacity/transform (barato no mobile). Respeita prefers-reduced-motion
 * via MotionConfig no layout.
 */
export function Revelar({
  children,
  atraso = 0,
  className,
  deslocamento = 28,
}: {
  children: ReactNode;
  atraso?: number;
  className?: string;
  deslocamento?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: deslocamento }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
