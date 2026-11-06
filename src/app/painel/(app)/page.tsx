import Link from "next/link";
import { CartaoGoogle } from "@/components/painel/CartaoGoogle";
import { cartao } from "@/components/painel/estilos";
import { obterConteudo } from "@/conteudo/obter";
import { idAnalyticsValido, verificacaoGoogleValida } from "@/lib/google";
import { siteUrl } from "@/lib/site";
import { listarPortfolio } from "@/servidor/conteudo";

const ATALHOS = [
  { href: "/painel/imagens", titulo: "Imagens", texto: "Fotos do topo, do Sobre, da chamada final e todas as fotos do portfólio." },
  { href: "/painel/site", titulo: "Editar site", texto: "Textos, imagens, cores, fontes e contatos." },
  { href: "/painel/site?secao=seo", titulo: "SEO e Google", texto: "Título no Google, Search Console e Analytics." },
  { href: "/painel/conta", titulo: "Conta", texto: "Senha e verificação em duas etapas." },
];

export default async function InicioPainel() {
  const [{ seo, portfolio }, fotos] = await Promise.all([obterConteudo(), listarPortfolio()]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl">Olá! 👋</h1>
      <p className="mt-1 text-texto-suave">O que você quer atualizar no site hoje?</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className={cartao}>
          <p className="font-titulo text-3xl">{fotos.length}</p>
          <p className="text-sm text-texto-suave">Fotos no portfólio</p>
        </div>
        <div className={cartao}>
          <p className="font-titulo text-3xl">{portfolio.categorias.length}</p>
          <p className="text-sm text-texto-suave">Categorias</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className={`${cartao} col-span-2 transition-all hover:shadow-md active:scale-[0.97] md:col-span-1`}>
          <p className="font-titulo text-xl">Ver o site ↗</p>
          <p className="text-sm text-texto-suave">Abre em uma nova aba.</p>
        </a>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {ATALHOS.map((a) => (
          <Link key={a.href} href={a.href} className={`${cartao} transition-all hover:shadow-md active:scale-[0.97]`}>
            <h2 className="text-xl">{a.titulo}</h2>
            <p className="text-sm text-texto-suave">{a.texto}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <CartaoGoogle
          urlSite={siteUrl().toString()}
          searchConsole={!!verificacaoGoogleValida(seo.googleVerificacao)}
          analytics={idAnalyticsValido(seo.googleAnalyticsId)}
        />
      </div>
    </div>
  );
}
