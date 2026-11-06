import { linkWhatsapp } from "@/lib/contato";
import { IconeWhatsapp } from "./Icones";

// CTA flutuante: sempre ao alcance do polegar no mobile (animação de entrada em CSS)
export function BotaoWhatsapp({ numero, mensagem }: { numero: string; mensagem: string }) {
  return (
    <a
      href={linkWhatsapp(numero, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      className="anim-whatsapp fixed bottom-5 right-5 z-30 inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-black/40 transition-transform hover:scale-[1.08] active:scale-95"
    >
      <IconeWhatsapp className="size-7" />
    </a>
  );
}
