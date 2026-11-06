"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { ConteudoSite } from "@/conteudo/tipos";

/**
 * Capa: foto em tela cheia (ponta a ponta, sem cantos arredondados) com o texto sobre ela.
 * O texto nasce visível (entrada só por deslocamento, em CSS): não espera o JavaScript,
 * o que mantém o LCP baixo no PageSpeed. O parallax na rolagem continua.
 */
export function Hero({ hero }: { hero: ConteudoSite["hero"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const escala = useTransform(scrollYProgress, [0, 1], [1.02, 1.12]);
  const yTexto = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const opacidade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section id="inicio" ref={ref} className="relative h-[100svh] min-h-[560px] overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale: escala }}>
        <Image src={hero.imagem.src} alt={hero.imagem.alt} fill priority sizes="100vw" className="object-cover object-[60%_center]" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      <motion.div className="absolute inset-x-0 bottom-0 pb-24 text-white sm:pb-14 lg:pb-20" style={{ y: yTexto, opacity: opacidade }}>
        <div className="container-site entrada-topo flex flex-col gap-5">
          <span className="w-max rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-md">
            {hero.etiqueta}
          </span>
          <h1 className="max-w-4xl text-5xl leading-[1.02] sm:text-7xl lg:text-8xl">{hero.titulo}</h1>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-base text-white/85 sm:text-lg">{hero.subtitulo}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={hero.ctaPrimario.href} className="botao bg-white text-grafite hover:bg-agua">
                {hero.ctaPrimario.texto}
              </a>
              <a href={hero.ctaSecundario.href} className="botao-claro">
                {hero.ctaSecundario.texto}
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
