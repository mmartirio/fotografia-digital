"use client";

import { useState } from "react";
import type { ConteudoSite } from "@/conteudo/tipos";
import { useDeslizar } from "@/lib/deslizar";
import { IconeSeta } from "../Icones";
import { Revelar } from "../Revelar";
import { TituloSecao } from "../TituloSecao";

type Item = ConteudoSite["depoimentos"]["itens"][number];

function Cartao({ d }: { d: Item }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl bg-superficie p-8">
      <span className="font-titulo text-6xl leading-[0.6] text-destaque/30" aria-hidden>
        &ldquo;
      </span>
      <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-texto">{d.texto}</blockquote>
      <figcaption className="mt-8 flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-grafite font-titulo text-lg text-white">
          {d.nome.trim().charAt(0)}
        </span>
        <span>
          <span className="block font-medium">{d.nome}</span>
          <span className="text-sm text-texto-suave">{d.ensaio}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Mobile: carrossel com UM depoimento por vez (centralizado), setas e indicadores
 * abaixo, e deslizar com o dedo. Desktop: os três lado a lado.
 */
export function Depoimentos({ depoimentos }: { depoimentos: ConteudoSite["depoimentos"] }) {
  const itens = depoimentos.itens;
  const [[indice, direcao], setAtual] = useState<[number, number]>([0, 0]);
  const total = itens.length;

  const ir = (passo: number) => setAtual(([i]) => [(i + passo + total) % total, passo]);
  const deslizar = useDeslizar((passo) => total > 1 && ir(passo));

  if (total === 0) return null;

  return (
    <section id="depoimentos" className="secao scroll-mt-16">
      <div className="container-site">
        <TituloSecao etiqueta={depoimentos.etiqueta} titulo={depoimentos.titulo} />

        {/* Mobile: carrossel */}
        <div className="md:hidden" aria-roledescription="carrossel" aria-label="Depoimentos">
          <div className="relative overflow-hidden">
            {/* key muda a cada troca: o novo depoimento entra pelo lado certo (animação em CSS) */}
            <div
              key={indice}
              {...deslizar}
              className={`touch-pan-y ${direcao > 0 ? "anim-slide-proximo" : direcao < 0 ? "anim-slide-anterior" : ""}`}
              aria-roledescription="slide"
              aria-label={`${indice + 1} de ${total}`}
            >
              <Cartao d={itens[indice]} />
            </div>
          </div>

          {total > 1 && (
            <div className="mt-6 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => ir(-1)}
                aria-label="Depoimento anterior"
                className="inline-flex size-12 items-center justify-center rounded-full border border-borda bg-white transition-all hover:border-grafite active:scale-90"
              >
                <IconeSeta direcao="esquerda" className="size-5" />
              </button>
              <div className="flex gap-2" role="tablist" aria-label="Escolher depoimento">
                {itens.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === indice}
                    aria-label={`Depoimento ${i + 1}`}
                    onClick={() => setAtual(([atual]) => [i, i >= atual ? 1 : -1])}
                    className="flex h-8 items-center"
                  >
                    <span className={`block h-2 rounded-full transition-all duration-300 ${i === indice ? "w-6 bg-grafite" : "w-2 bg-black/15"}`} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => ir(1)}
                aria-label="Próximo depoimento"
                className="inline-flex size-12 items-center justify-center rounded-full border border-borda bg-white transition-all hover:border-grafite active:scale-90"
              >
                <IconeSeta direcao="direita" className="size-5" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop: grade */}
        <div className="hidden gap-4 md:grid md:grid-cols-3">
          {itens.map((d, i) => (
            <Revelar key={i} atraso={0.1 * i} className="h-full">
              <Cartao d={d} />
            </Revelar>
          ))}
        </div>
      </div>
    </section>
  );
}
