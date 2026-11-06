import {
  Bebas_Neue,
  Cormorant_Garamond,
  DM_Serif_Display,
  Josefin_Sans,
  Lato,
  Lora,
  Montserrat,
  Playfair_Display,
  Poppins,
  Raleway,
  Roboto,
} from "next/font/google";

/*
 * next/font exige declaração estática e opções LITERAIS (sem spread/variáveis).
 * Todas viram variáveis CSS, mas o navegador só baixa as fontes realmente usadas.
 * preload só nas padrões (Playfair, Roboto, Bebas) para não atrasar o carregamento.
 */
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", variable: "--f-playfair" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", variable: "--f-cormorant", weight: ["400", "500", "600"], preload: false });
const lora = Lora({ subsets: ["latin"], display: "swap", variable: "--f-lora", preload: false });
const dmserif = DM_Serif_Display({ subsets: ["latin"], display: "swap", variable: "--f-dmserif", weight: "400", preload: false });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", variable: "--f-montserrat", preload: false });
const raleway = Raleway({ subsets: ["latin"], display: "swap", variable: "--f-raleway", preload: false });
const poppins = Poppins({ subsets: ["latin"], display: "swap", variable: "--f-poppins", weight: ["300", "400", "500", "600"], preload: false });
const josefin = Josefin_Sans({ subsets: ["latin"], display: "swap", variable: "--f-josefin", preload: false });
const roboto = Roboto({ subsets: ["latin"], display: "swap", variable: "--f-roboto", weight: ["300", "400", "500", "700"] });
const lato = Lato({ subsets: ["latin"], display: "swap", variable: "--f-lato", weight: ["300", "400", "700"], preload: false });
const bebas = Bebas_Neue({ subsets: ["latin"], display: "swap", variable: "--font-bebas", weight: "400" });

export const classesFontes = [playfair, cormorant, lora, dmserif, montserrat, raleway, poppins, josefin, roboto, lato, bebas]
  .map((f) => f.variable)
  .join(" ");
