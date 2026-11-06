import Image from "next/image";
import type { ConteudoSite } from "@/conteudo/tipos";
import { linkWhatsapp } from "@/lib/contato";
import { IconeWhatsapp } from "../Icones";
import { Revelar } from "../Revelar";

/** Faixa de ponta a ponta (colada nas laterais da janela e no rodapé, sem cantos arredondados). */
export function CtaFinal({ cta, contato }: { cta: ConteudoSite["ctaFinal"]; contato: ConteudoSite["contato"] }) {
  return (
    <section id="chamada-final">
      <div className="relative overflow-hidden bg-escuro py-24 md:py-36">
        {cta.imagem.src && <Image src={cta.imagem.src} alt="" fill sizes="100vw" className="object-cover" aria-hidden />}
        <div className="absolute inset-0 bg-escuro/65" />
        <Revelar className="container-site relative flex flex-col items-center text-center text-white">
          <h2 className="max-w-3xl text-4xl leading-[1.1] sm:text-6xl lg:text-7xl">{cta.titulo}</h2>
          <p className="mt-5 text-lg text-white/80">{cta.subtitulo}</p>
          <a
            href={linkWhatsapp(contato.whatsapp, contato.mensagemWhatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="botao mt-10 bg-white text-grafite hover:bg-agua"
          >
            <IconeWhatsapp className="size-5 text-whatsapp" /> {cta.botao}
          </a>
        </Revelar>
      </div>
    </section>
  );
}
