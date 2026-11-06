"use client";

import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConteudoSite } from "@/conteudo/tipos";
import { IconeFechar, IconeSeta } from "../Icones";
import { TituloSecao } from "../TituloSecao";

const POR_PAGINA = 6;

/**
 * Grade uniforme (todas as fotos no mesmo formato), poucas por vez e
 * "Ver mais" sob demanda: visual limpo em vez de um mosaico longo.
 */
export function Portfolio({ portfolio }: { portfolio: ConteudoSite["portfolio"] }) {
  const [categoria, setCategoria] = useState<string>("todas");
  const [visiveis, setVisiveis] = useState(POR_PAGINA);
  const [aberta, setAberta] = useState<number | null>(null);

  const fotos = useMemo(
    () => (categoria === "todas" ? portfolio.fotos : portfolio.fotos.filter((f) => f.categoria === categoria)),
    [categoria, portfolio.fotos],
  );
  const exibidas = fotos.slice(0, visiveis);

  const navegar = useCallback(
    (passo: number) => setAberta((i) => (i === null ? i : (i + passo + fotos.length) % fotos.length)),
    [fotos.length],
  );

  useEffect(() => {
    if (aberta === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberta(null);
      if (e.key === "ArrowRight") navegar(1);
      if (e.key === "ArrowLeft") navegar(-1);
    };
    window.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [aberta, navegar]);

  const aoArrastar = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) navegar(1);
    else if (info.offset.x > 60) navegar(-1);
  };

  const filtros = [{ slug: "todas", nome: "Todas" }, ...portfolio.categorias];
  const atual = aberta !== null ? fotos[aberta] : null;

  return (
    <section id="portfolio" className="secao scroll-mt-16">
      <div className="container-site">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <TituloSecao etiqueta={portfolio.etiqueta} titulo={portfolio.titulo} subtitulo={portfolio.subtitulo} semMargem />
          {/* Filtros: quebram em linhas no mobile (todos visíveis, sem rolagem lateral) */}
          <div>
            <div className="flex flex-wrap gap-2 md:gap-1 md:rounded-full md:bg-superficie md:p-1" role="tablist" aria-label="Categorias do portfólio">
              {filtros.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  role="tab"
                  aria-selected={categoria === c.slug}
                  onClick={() => {
                    setCategoria(c.slug);
                    setVisiveis(POR_PAGINA);
                  }}
                  className={`min-h-10 rounded-full px-4 text-sm transition-all ${
                    categoria === c.slug
                      ? "bg-grafite font-medium text-white md:bg-white md:text-grafite md:shadow-sm"
                      : "bg-superficie text-texto-suave hover:text-grafite md:bg-transparent"
                  }`}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grade uniforme: 2 colunas no mobile, 3 no desktop, todas em 4:5 */}
        <motion.ul layout className="mt-12 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-3 md:gap-5">
          <AnimatePresence mode="popLayout">
            {exibidas.map((f, i) => (
              <motion.li
                key={f.src}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, delay: (i % POR_PAGINA) * 0.04 }}
              >
                <button
                  type="button"
                  onClick={() => setAberta(i)}
                  className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-superficie"
                  aria-label={`Ampliar: ${f.alt}`}
                >
                  <Image
                    src={f.src}
                    alt={f.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/60 to-transparent p-4 text-left text-sm text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {portfolio.categorias.find((c) => c.slug === f.categoria)?.nome}
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {visiveis < fotos.length && (
          <div className="mt-12 flex justify-center">
            <button type="button" onClick={() => setVisiveis((v) => v + POR_PAGINA)} className="botao-secundario">
              Ver mais fotos <span className="text-texto-suave">({fotos.length - visiveis})</span>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {atual && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            role="dialog"
            aria-modal="true"
            aria-label={atual.alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAberta(null)}
          >
            <motion.div
              key={atual.src}
              className="relative h-[80svh] w-full max-w-5xl touch-pan-y px-2"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={aoArrastar}
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={atual.src} alt={atual.alt} fill sizes="100vw" className="pointer-events-none object-contain" />
            </motion.div>

            <p className="absolute bottom-5 left-0 right-0 px-16 text-center text-sm text-white/70">
              {(aberta ?? 0) + 1} / {fotos.length}
            </p>

            <button
              type="button"
              aria-label="Fechar"
              className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              onClick={() => setAberta(null)}
            >
              <IconeFechar className="text-white" />
            </button>
            <button
              type="button"
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 md:inline-flex"
              onClick={(e) => {
                e.stopPropagation();
                navegar(-1);
              }}
            >
              <IconeSeta direcao="esquerda" className="text-white" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 md:inline-flex"
              onClick={(e) => {
                e.stopPropagation();
                navegar(1);
              }}
            >
              <IconeSeta direcao="direita" className="text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
