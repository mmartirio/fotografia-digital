/**
 * Fontes disponíveis no painel (Aparência). Cada uma vira uma variável CSS
 * --f-{slug} definida no layout raiz (next/font, auto-hospedadas).
 */
export const FONTES = [
  { slug: "playfair", nome: "Playfair Display", estilo: "Serifada elegante" },
  { slug: "cormorant", nome: "Cormorant Garamond", estilo: "Serifada clássica" },
  { slug: "lora", nome: "Lora", estilo: "Serifada suave" },
  { slug: "dmserif", nome: "DM Serif Display", estilo: "Serifada marcante" },
  { slug: "montserrat", nome: "Montserrat", estilo: "Sem serifa geométrica" },
  { slug: "raleway", nome: "Raleway", estilo: "Sem serifa refinada" },
  { slug: "poppins", nome: "Poppins", estilo: "Sem serifa moderna" },
  { slug: "josefin", nome: "Josefin Sans", estilo: "Sem serifa vintage" },
  { slug: "roboto", nome: "Roboto", estilo: "Sem serifa neutra" },
  { slug: "lato", nome: "Lato", estilo: "Sem serifa amigável" },
] as const;

export type SlugFonte = (typeof FONTES)[number]["slug"];

export function fonteValida(slug: string | undefined, padrao: SlugFonte): SlugFonte {
  return (FONTES.some((f) => f.slug === slug) ? slug : padrao) as SlugFonte;
}

export const varFonte = (slug: string) => `var(--f-${slug})`;
