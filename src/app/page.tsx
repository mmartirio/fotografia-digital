import type { Metadata } from "next";
import { BotaoWhatsapp } from "@/components/BotaoWhatsapp";
import { Cabecalho } from "@/components/Cabecalho";
import { ObservadorRevelar } from "@/components/ObservadorRevelar";
import { ProtecaoConteudo } from "@/components/ProtecaoConteudo";
import { Rodape } from "@/components/Rodape";
import { ComoFunciona } from "@/components/secoes/ComoFunciona";
import { CtaFinal } from "@/components/secoes/CtaFinal";
import { Depoimentos } from "@/components/secoes/Depoimentos";
import { Faq } from "@/components/secoes/Faq";
import { Hero } from "@/components/secoes/Hero";
import { Orcamento } from "@/components/secoes/Orcamento";
import { Portfolio } from "@/components/secoes/Portfolio";
import { Servicos } from "@/components/secoes/Servicos";
import { Sobre } from "@/components/secoes/Sobre";
import { obterConteudo } from "@/conteudo/obter";
import { siteUrl } from "@/lib/site";
import { linkInstagram } from "@/lib/contato";
import { idAnalyticsValido } from "@/lib/google";

/**
 * JSON para dentro de <script>: "<" vira \u003c (e os separadores de linha
 * Unicode são escapados), então um texto com </script> não fecha a tag.
 */
function jsonSeguro(dados: unknown): string {
  return JSON.stringify(dados)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Imagem ao compartilhar o link: a escolhida no painel; se foi excluída, a do topo; por último, a logo. */
function imagemCompartilhamento(c: Awaited<ReturnType<typeof obterConteudo>>): string {
  return c.seo.imagemOg || c.hero.imagem.src || c.aparencia.logo || "/marca/icone.png";
}

export async function generateMetadata(): Promise<Metadata> {
  const c = await obterConteudo();
  const { seo, marca } = c;
  const imagem = imagemCompartilhamento(c);
  return {
    title: { absolute: seo.titulo },
    description: seo.descricao,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: marca,
      title: seo.titulo,
      description: seo.descricao,
      images: [{ url: imagem }],
    },
    twitter: { card: "summary_large_image", title: seo.titulo, description: seo.descricao, images: [imagem] },
  };
}

export default async function Home() {
  const c = await obterConteudo();
  const url = siteUrl().toString();

  // Dados estruturados (schema.org) para o Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: c.marca,
    description: c.seo.descricao,
    url,
    image: new URL(imagemCompartilhamento(c), url).toString(),
    logo: new URL(c.aparencia.logo, url).toString(),
    slogan: c.slogan,
    telephone: `+${c.contato.whatsapp}`,
    address: { "@type": "PostalAddress", addressRegion: "SE", addressCountry: "BR" },
    areaServed: { "@type": "State", name: "Sergipe" },
    sameAs: [linkInstagram(c.contato.instagram)],
    makesOffer: c.servicos.itens.map((s) => ({ "@type": "Offer", name: s.nome, description: s.descricao })),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.itens.map((f) => ({
      "@type": "Question",
      name: f.pergunta,
      acceptedAnswer: { "@type": "Answer", text: f.resposta },
    })),
  };

  return (
    <ProtecaoConteudo>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(faqLd) }} />
      <Cabecalho marca={c.marca} aparencia={c.aparencia} />
      <main>
        <Hero hero={c.hero} />
        <Portfolio portfolio={c.portfolio} />
        <Sobre sobre={c.sobre} />
        <Servicos servicos={c.servicos} />
        <ComoFunciona comoFunciona={c.comoFunciona} />
        <Depoimentos depoimentos={c.depoimentos} />
        <Faq faq={c.faq} />
        <Orcamento orcamento={c.orcamento} contato={c.contato} />
        <CtaFinal cta={c.ctaFinal} contato={c.contato} />
      </main>
      <Rodape marca={c.marca} slogan={c.slogan} contato={c.contato} nomeLogo={c.aparencia.nomeLogo} coresNome={c.aparencia.coresNome} rodape={c.rodape} analyticsAtivo={!!idAnalyticsValido(c.seo.googleAnalyticsId)} />
      <BotaoWhatsapp numero={c.contato.whatsapp} mensagem={c.contato.mensagemWhatsapp} />
      <ObservadorRevelar />
    </ProtecaoConteudo>
  );
}
