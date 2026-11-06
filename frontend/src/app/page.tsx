import type { Metadata } from "next";
import { BotaoWhatsapp } from "@/components/BotaoWhatsapp";
import { Cabecalho } from "@/components/Cabecalho";
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
import { siteUrl } from "@/lib/backend";
import { linkInstagram } from "@/lib/contato";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, marca } = await obterConteudo();
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
      images: [{ url: seo.imagemOg }],
    },
    twitter: { card: "summary_large_image", title: seo.titulo, description: seo.descricao, images: [seo.imagemOg] },
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
    image: new URL(c.seo.imagemOg, url).toString(),
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
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
      <Rodape marca={c.marca} slogan={c.slogan} contato={c.contato} nomeLogo={c.aparencia.nomeLogo} coresNome={c.aparencia.coresNome} rodape={c.rodape} />
      <BotaoWhatsapp numero={c.contato.whatsapp} mensagem={c.contato.mensagemWhatsapp} />
    </>
  );
}
