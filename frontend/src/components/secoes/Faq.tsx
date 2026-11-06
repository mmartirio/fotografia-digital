import type { ConteudoSite } from "@/conteudo/tipos";
import { IconeMais } from "../Icones";
import { Revelar } from "../Revelar";
import { TituloSecao } from "../TituloSecao";

// <details>/<summary>: acessível e funciona sem JavaScript
export function Faq({ faq }: { faq: ConteudoSite["faq"] }) {
  return (
    <section id="faq" className="secao scroll-mt-16 bg-superficie">
      <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <TituloSecao etiqueta={faq.etiqueta} titulo={faq.titulo} semMargem />
        <Revelar className="flex flex-col gap-3">
          {faq.itens.map((item) => (
            <details key={item.pergunta} className="group rounded-2xl bg-white ring-1 ring-black/5 open:shadow-sm">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-left text-lg font-medium [&::-webkit-details-marker]:hidden">
                {item.pergunta}
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-superficie transition-colors group-open:bg-grafite group-open:text-white">
                  <IconeMais className="size-4 transition-transform duration-300 group-open:rotate-45" />
                </span>
              </summary>
              <p className="px-6 pb-6 leading-relaxed text-texto-suave">{item.resposta}</p>
            </details>
          ))}
        </Revelar>
      </div>
    </section>
  );
}
