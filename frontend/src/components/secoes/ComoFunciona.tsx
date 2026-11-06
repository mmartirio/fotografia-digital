import type { ConteudoSite } from "@/conteudo/tipos";
import { Revelar } from "../Revelar";
import { TituloSecao } from "../TituloSecao";

/**
 * Passos em cartões numerados. Mobile: compactos (número ao lado do texto);
 * desktop: 4 colunas com o número em destaque.
 */
export function ComoFunciona({ comoFunciona }: { comoFunciona: ConteudoSite["comoFunciona"] }) {
  return (
    <section id="como-funciona" className="secao scroll-mt-16 bg-superficie">
      <div className="container-site">
        <TituloSecao etiqueta={comoFunciona.etiqueta} titulo={comoFunciona.titulo} />
        <ol className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {comoFunciona.passos.map((p, i) => (
            <li key={p.titulo} className="list-none">
              <Revelar atraso={0.1 * i} className="flex h-full gap-5 rounded-3xl bg-white p-6 ring-1 ring-black/5 sm:flex-col sm:gap-0 sm:p-8">
                <span className="font-titulo text-3xl leading-none text-destaque/30 sm:text-5xl">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-xl sm:mt-6 sm:text-2xl">{p.titulo}</h3>
                  <p className="mt-1 text-texto-suave sm:mt-2">{p.descricao}</p>
                </div>
              </Revelar>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
