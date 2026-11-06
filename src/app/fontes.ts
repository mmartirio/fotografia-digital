import localFont from "next/font/local";

/*
 * Fontes guardadas no próprio projeto (src/app/fontes/, subconjunto latino, licença SIL OFL em fontes/licencas/).
 * O build não depende do Google Fonts, que às vezes falhava ao baixar as fontes durante o deploy.
 * next/font exige declaração estática e opções LITERAIS (sem spread/variáveis).
 * Todas viram variáveis CSS, mas o navegador só baixa as fontes realmente usadas.
 * preload só nas padrões (Playfair, Roboto, Bebas) para não atrasar o carregamento.
 * Origem dos arquivos: pacotes @fontsource / @fontsource-variable (npm).
 */
const playfair = localFont({ src: "./fontes/playfair-display-latin-wght-normal.woff2", weight: "400 900", display: "swap", variable: "--f-playfair" });
const cormorant = localFont({ src: "./fontes/cormorant-garamond-latin-wght-normal.woff2", weight: "300 700", display: "swap", variable: "--f-cormorant", preload: false });
const lora = localFont({ src: "./fontes/lora-latin-wght-normal.woff2", weight: "400 700", display: "swap", variable: "--f-lora", preload: false });
const dmserif = localFont({ src: "./fontes/dm-serif-display-latin-400-normal.woff2", weight: "400", display: "swap", variable: "--f-dmserif", preload: false });
const montserrat = localFont({ src: "./fontes/montserrat-latin-wght-normal.woff2", weight: "100 900", display: "swap", variable: "--f-montserrat", preload: false });
const raleway = localFont({ src: "./fontes/raleway-latin-wght-normal.woff2", weight: "100 900", display: "swap", variable: "--f-raleway", preload: false });
const poppins = localFont({
  src: [
    { path: "./fontes/poppins-latin-400-normal.woff2", weight: "400" },
    { path: "./fontes/poppins-latin-500-normal.woff2", weight: "500" },
    { path: "./fontes/poppins-latin-600-normal.woff2", weight: "600" },
    { path: "./fontes/poppins-latin-700-normal.woff2", weight: "700" },
  ],
  display: "swap",
  variable: "--f-poppins",
  preload: false,
});
const josefin = localFont({ src: "./fontes/josefin-sans-latin-wght-normal.woff2", weight: "100 700", display: "swap", variable: "--f-josefin", preload: false });
const roboto = localFont({ src: "./fontes/roboto-latin-wght-normal.woff2", weight: "100 900", display: "swap", variable: "--f-roboto" });
const lato = localFont({
  src: [
    { path: "./fontes/lato-latin-400-normal.woff2", weight: "400" },
    { path: "./fontes/lato-latin-700-normal.woff2", weight: "700" },
  ],
  display: "swap",
  variable: "--f-lato",
  preload: false,
});
const bebas = localFont({ src: "./fontes/bebas-neue-latin-400-normal.woff2", weight: "400", display: "swap", variable: "--font-bebas" });

export const classesFontes = [playfair, cormorant, lora, dmserif, montserrat, raleway, poppins, josefin, roboto, lato, bebas]
  .map((f) => f.variable)
  .join(" ");
