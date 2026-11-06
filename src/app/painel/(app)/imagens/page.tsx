import type { Metadata } from "next";
import { GerenciadorImagens, type ItemImagem } from "@/components/painel/GerenciadorImagens";
import { obterConteudo, valorSecao } from "@/conteudo/obter";
import { listarPortfolio } from "@/servidor/conteudo";

export const metadata: Metadata = { title: "Imagens" };
export const dynamic = "force-dynamic";

/** Todas as imagens da landing em um só lugar, na ordem em que aparecem no site. */
export default async function Imagens() {
  const [c, fotos] = await Promise.all([obterConteudo(), listarPortfolio()]);

  const itens: ItemImagem[] = [
    {
      id: "hero",
      titulo: "Foto do topo",
      onde: "Primeira coisa que o visitante vê, em tela cheia. Prefira foto na horizontal.",
      secao: "hero",
      campo: "imagem",
      valorSecao: valorSecao(c, "hero"),
      proporcao: "aspect-[16/9]",
      semImagem: "O topo fica com fundo escuro atrás do texto.",
    },
    {
      id: "sobre",
      titulo: "Foto da seção Sobre",
      onde: "Ao lado do texto de apresentação. Uma foto sua funciona bem.",
      secao: "sobre",
      campo: "imagem",
      valorSecao: valorSecao(c, "sobre"),
      proporcao: "aspect-[4/5]",
      semImagem: "A seção Sobre mostra só o texto.",
    },
    {
      id: "ctaFinal",
      titulo: "Foto da chamada final",
      onde: "Faixa em tela cheia logo acima do rodapé, atrás do botão do WhatsApp.",
      secao: "ctaFinal",
      campo: "imagem",
      valorSecao: valorSecao(c, "ctaFinal"),
      proporcao: "aspect-[16/9]",
      semImagem: "A chamada final fica com fundo escuro.",
    },
    {
      id: "og",
      titulo: "Imagem ao compartilhar o link",
      onde: "Aparece quando alguém envia o link do site no WhatsApp, Instagram ou Facebook. Ideal: horizontal.",
      secao: "seo",
      campo: "imagemOg",
      valorSecao: valorSecao(c, "seo"),
      proporcao: "aspect-[1.91/1]",
      semImagem: "Ao compartilhar o link, aparece a foto do topo (ou a logo).",
    },
  ];

  return (
    <GerenciadorImagens
      itens={itens}
      logo={c.aparencia.logo}
      fotos={fotos}
      categorias={c.portfolio.categorias}
      exemplos={c.portfolio.fotos.map((f) => f.src)}
    />
  );
}
