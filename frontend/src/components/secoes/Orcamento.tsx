import type { ConteudoSite } from "@/conteudo/tipos";
import { linkInstagram, linkWhatsapp } from "@/lib/contato";
import { IconeInstagram, IconeLocal, IconeSeta, IconeWhatsapp } from "../Icones";
import { Revelar } from "../Revelar";

/**
 * Contato direto (sem formulário): WhatsApp e Instagram, os canais do fotógrafo.
 * Mantém o id "orcamento" para os botões do site continuarem chegando aqui.
 */
export function Orcamento({ orcamento, contato }: { orcamento: ConteudoSite["orcamento"]; contato: ConteudoSite["contato"] }) {
  return (
    <section id="orcamento" className="secao scroll-mt-16">
      <div className="container-site grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <Revelar>
          <p className="etiqueta">{orcamento.etiqueta}</p>
          <h2 className="mt-4 max-w-xl text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">{orcamento.titulo}</h2>
          <p className="mt-6 max-w-md text-lg text-texto-suave">{orcamento.subtitulo}</p>
          <p className="mt-8 flex items-center gap-2 text-sm text-texto-suave">
            <IconeLocal className="size-5 text-destaque" /> {contato.cidade}
          </p>
        </Revelar>

        <Revelar atraso={0.15} className="flex flex-col gap-3">
          <a
            href={linkWhatsapp(contato.whatsapp, contato.mensagemWhatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 rounded-3xl bg-grafite p-6 text-white transition-all hover:bg-[#1f8f4e] active:scale-[0.98] md:p-8"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-whatsapp">
              <IconeWhatsapp className="size-7" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-white/70">Resposta mais rápida</span>
              <span className="block text-2xl font-medium md:text-3xl">Chamar no WhatsApp</span>
            </span>
            <IconeSeta className="size-6 shrink-0 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href={linkInstagram(contato.instagram)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 rounded-3xl bg-superficie p-6 transition-all hover:bg-agua/40 active:scale-[0.98] md:p-8"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white">
              <IconeInstagram className="size-7" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-texto-suave">Veja mais trabalhos</span>
              <span className="block truncate text-2xl font-medium md:text-3xl">@{contato.instagram}</span>
            </span>
            <IconeSeta className="size-6 shrink-0 transition-transform group-hover:translate-x-1" />
          </a>
        </Revelar>
      </div>
    </section>
  );
}
