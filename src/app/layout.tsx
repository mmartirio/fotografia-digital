import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Analytics } from "@/components/Analytics";
import { ProvedorMovimento } from "@/components/ProvedorMovimento";
import { obterConteudo } from "@/conteudo/obter";
import { siteUrl } from "@/lib/site";
import { fonteValida, varFonte } from "@/lib/fontes-lista";
import { idAnalyticsValido, verificacaoGoogleValida } from "@/lib/google";
import { classesFontes } from "./fontes";
import "./globals.css";

// Padrões globais; a home sobrescreve título/descrição com o SEO do conteúdo (editável no painel)
export async function generateMetadata(): Promise<Metadata> {
  const { marca, aparencia, seo } = await obterConteudo();
  const verificacao = verificacaoGoogleValida(seo.googleVerificacao);
  return {
    metadataBase: siteUrl(),
    title: { default: marca, template: `%s | ${marca}` },
    description: "Fotografia e vídeo de casamentos, ensaios e eventos. Registrando momentos desde 2018.",
    // Favicon = logo escolhida no painel (Aparência)
    icons: { icon: aparencia.logo, apple: aparencia.logo || "/marca/apple-icon.png" },
    // Google Search Console: <meta name="google-site-verification"> (configurado no painel → SEO)
    ...(verificacao ? { verification: { google: verificacao } } : {}),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbfbfa",
  colorScheme: "light",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { aparencia, seo } = await obterConteudo();
  // Fontes escolhidas no painel: sobrescrevem as variáveis do tema (globals.css)
  const estilo = {
    "--font-titulo": varFonte(fonteValida(aparencia.fonteTitulos, "playfair")),
    "--font-corpo": varFonte(fonteValida(aparencia.fonteTexto, "roboto")),
  } as CSSProperties;

  return (
    <html lang="pt-BR" className={classesFontes} style={estilo} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        {/* Liga as animações de "revelar ao rolar" só quando há JavaScript (sem JS, tudo visível) */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js-pronto')" }} />
        <ProvedorMovimento>{children}</ProvedorMovimento>
        {/* Google Analytics 4 com consentimento (só carrega após o visitante aceitar) */}
        <Analytics idMedicao={idAnalyticsValido(seo.googleAnalyticsId)} />
      </body>
    </html>
  );
}
