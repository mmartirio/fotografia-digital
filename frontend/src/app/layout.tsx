import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { ProvedorMovimento } from "@/components/ProvedorMovimento";
import { obterConteudo } from "@/conteudo/obter";
import { siteUrl } from "@/lib/backend";
import { fonteValida, varFonte } from "@/lib/fontes-lista";
import { classesFontes } from "./fontes";
import "./globals.css";

// Padrões globais; a home sobrescreve título/descrição com o SEO do conteúdo (editável no painel)
export async function generateMetadata(): Promise<Metadata> {
  const { marca, aparencia } = await obterConteudo();
  return {
    metadataBase: siteUrl(),
    title: { default: marca, template: `%s | ${marca}` },
    description: "Fotografia e vídeo de casamentos, ensaios e eventos. Registrando momentos desde 2018.",
    // Favicon = logo escolhida no painel (Aparência)
    icons: { icon: aparencia.logo, apple: "/marca/apple-icon.png" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbfbfa",
  colorScheme: "light",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { aparencia } = await obterConteudo();
  // Fontes escolhidas no painel: sobrescrevem as variáveis do tema (globals.css)
  const estilo = {
    "--font-titulo": varFonte(fonteValida(aparencia.fonteTitulos, "playfair")),
    "--font-corpo": varFonte(fonteValida(aparencia.fonteTexto, "roboto")),
  } as CSSProperties;

  return (
    <html lang="pt-BR" className={classesFontes} style={estilo}>
      <body>
        <ProvedorMovimento>{children}</ProvedorMovimento>
      </body>
    </html>
  );
}
