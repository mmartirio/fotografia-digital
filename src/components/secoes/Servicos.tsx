import type { ConteudoSite } from "@/conteudo/tipos";
import { IconeCheck } from "../Icones";
import { Revelar } from "../Revelar";
import { TituloSecao } from "../TituloSecao";

export function Servicos({ servicos }: { servicos: ConteudoSite["servicos"] }) {
  return (
    <section id="servicos" className="secao scroll-mt-16">
      <div className="container-site">
        <TituloSecao etiqueta={servicos.etiqueta} titulo={servicos.titulo} subtitulo={servicos.subtitulo} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {servicos.itens.map((s, i) => (
            <Revelar key={s.nome} atraso={0.08 * i} className="h-full">
              <article
                className={`flex h-full flex-col rounded-3xl p-7 transition-transform duration-500 hover:-translate-y-1 ${
                  s.destaque ? "bg-grafite text-white" : "bg-superficie"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl lg:text-[1.75rem]">{s.nome}</h3>
                  {s.destaque && <span className="shrink-0 rounded-full bg-agua px-3 py-1 text-[11px] font-semibold text-grafite">Popular</span>}
                </div>
                <p className={`mt-2 text-sm ${s.destaque ? "text-white/70" : "text-texto-suave"}`}>{s.descricao}</p>
                <ul className={`mt-6 flex flex-1 flex-col gap-3 border-t pt-6 text-sm ${s.destaque ? "border-white/15" : "border-black/5"}`}>
                  {s.inclui.map((item) => (
                    <li key={item} className="flex gap-3">
                      <IconeCheck className={`size-5 shrink-0 ${s.destaque ? "text-agua" : "text-destaque"}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className={`mt-6 text-sm ${s.destaque ? "text-white/70" : "text-texto-suave"}`}>{s.preco}</p>
                <a
                  href="#orcamento"
                  className={`mt-3 ${s.destaque ? "botao bg-white text-grafite hover:bg-agua" : "botao-secundario"}`}
                >
                  Pedir orçamento
                </a>
              </article>
            </Revelar>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-texto-suave">{servicos.observacao}</p>
      </div>
    </section>
  );
}
