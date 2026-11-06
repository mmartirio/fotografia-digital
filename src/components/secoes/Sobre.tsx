import Image from "next/image";
import type { ConteudoSite } from "@/conteudo/tipos";
import { Revelar } from "../Revelar";

/** Texto + foto com cantos arredondados, dentro da área do site. */
export function Sobre({ sobre }: { sobre: ConteudoSite["sobre"] }) {
  return (
    <section id="sobre" className="secao scroll-mt-16 bg-superficie lg:scroll-mt-20">
      <div className={`container-site grid items-center gap-12 lg:gap-24 ${sobre.imagem.src ? "md:grid-cols-2" : ""}`}>
        {/* sem foto (excluída no painel): só o texto */}
        {sobre.imagem.src && (
          <Revelar className="relative aspect-[4/5] overflow-hidden rounded-[2rem] md:order-last">
            <Image src={sobre.imagem.src} alt={sobre.imagem.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </Revelar>
        )}

        <div className={sobre.imagem.src ? "" : "mx-auto max-w-3xl"}>
          <Revelar>
            <p className="etiqueta">{sobre.etiqueta}</p>
            <h2 className="mt-4 text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">{sobre.titulo}</h2>
          </Revelar>
          {sobre.paragrafos.map((p, i) => (
            <Revelar key={i} atraso={0.1 * (i + 1)}>
              <p className="mt-6 text-lg leading-relaxed text-texto-suave">{p}</p>
            </Revelar>
          ))}

          {/* Destaques: dt (legenda) vem antes no HTML para leitura correta;
              visualmente o valor fica em cima (flex-col-reverse). */}
          {sobre.numeros.length > 0 && (
            <Revelar atraso={0.3}>
              <dl
                className={`mt-12 grid grid-cols-1 divide-y divide-black/5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 sm:divide-x sm:divide-y-0 ${
                  ["", "", "sm:grid-cols-2", "sm:grid-cols-3"][Math.min(sobre.numeros.length, 3)]
                }`}
              >
                {sobre.numeros.map((n) => (
                  <div key={n.rotulo} className="flex flex-col-reverse gap-1 p-5 sm:p-6">
                    <dt className="text-sm leading-snug text-texto-suave">{n.rotulo}</dt>
                    <dd className="font-titulo text-3xl leading-none text-grafite">{n.valor}</dd>
                  </div>
                ))}
              </dl>
            </Revelar>
          )}
        </div>
      </div>
    </section>
  );
}
