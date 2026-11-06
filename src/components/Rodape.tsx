import Link from "next/link";
import type { ConteudoSite } from "@/conteudo/tipos";
import { linkInstagram, linkWhatsapp } from "@/lib/contato";
import { IconeInstagram, IconeWhatsapp } from "./Icones";
import { BotaoCookies } from "./BotaoCookies";
import { Marca } from "./Marca";

export function Rodape({
  marca,
  slogan,
  contato,
  nomeLogo,
  coresNome,
  rodape,
  analyticsAtivo = false,
}: {
  rodape: ConteudoSite["rodape"];
  analyticsAtivo?: boolean;
  nomeLogo: string;
  coresNome: string[];
  marca: string;
  slogan: string;
  contato: ConteudoSite["contato"];
}) {
  // Canais do fotógrafo: WhatsApp e Instagram
  const redes = [
    { href: linkWhatsapp(contato.whatsapp, contato.mensagemWhatsapp), rotulo: "WhatsApp", Icone: IconeWhatsapp },
    { href: linkInstagram(contato.instagram), rotulo: "Instagram", Icone: IconeInstagram },
  ];

  return (
    <footer id="rodape" className="bg-escuro pb-24 pt-16 text-white md:pb-12">
      <div className="container-site flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <Link href="#inicio" aria-label={marca} className="text-4xl">
            {nomeLogo.trim() ? <Marca nome={nomeLogo} cores={coresNome} claro /> : marca}
          </Link>
          {slogan && <p className="mt-3 text-xs font-medium uppercase tracking-[0.3em] text-white/50">{slogan}</p>}
          {rodape.atendimento && <p className="mt-3 text-sm text-white/60">{rodape.atendimento}</p>}
        </div>
        <ul className="flex gap-2">
          {redes.map(({ href, rotulo, Icone }) => (
            <li key={rotulo}>
              <a
                href={href}
                aria-label={rotulo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-12 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white hover:text-grafite"
              >
                <Icone className="size-5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="container-site mt-12 flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:justify-between">
        <p>
          © {new Date().getFullYear()} {marca}. {rodape.direitos}
        </p>
        <div className="flex gap-4">
          {analyticsAtivo && <BotaoCookies />}
        </div>
      </div>
    </footer>
  );
}
