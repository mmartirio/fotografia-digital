import Link from "next/link";
import { cartao } from "./estilos";

/**
 * Atalhos e status das ferramentas do Google (Search Console, Analytics e PageSpeed).
 * As contas são do fotógrafo: aqui só ficam os códigos/IDs (Editar site → SEO).
 */
export function CartaoGoogle({
  urlSite,
  searchConsole,
  analytics,
}: {
  urlSite: string;
  searchConsole: boolean;
  analytics: string | null;
}) {
  const local = /localhost|127\.0\.0\.1/.test(urlSite);
  const itens = [
    {
      nome: "Google Search Console",
      descricao: "Como o site aparece nas buscas, cliques e erros de indexação.",
      ok: searchConsole,
      status: searchConsole ? "Código de verificação configurado" : "Falta o código de verificação",
      href: "https://search.google.com/search-console",
      acao: "Abrir Search Console",
    },
    {
      nome: "Google Analytics 4",
      descricao: "Visitas, origem do público e velocidade real (Core Web Vitals).",
      ok: !!analytics,
      status: analytics ? `Ativo (${analytics})` : "Falta o ID de medição",
      href: "https://analytics.google.com/",
      acao: "Abrir Analytics",
    },
    {
      nome: "PageSpeed Insights",
      descricao: "Nota de desempenho, acessibilidade, boas práticas e SEO (celular e computador).",
      ok: !local,
      status: local ? "Disponível quando o site estiver publicado" : urlSite,
      href: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(urlSite)}`,
      acao: "Analisar agora",
    },
  ];

  return (
    <section className={cartao}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl">Google e desempenho</h2>
        <Link href="/painel/site?secao=seo" className="text-sm text-destaque underline">
          Configurar códigos (Editar site → SEO)
        </Link>
      </div>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {itens.map((i) => (
          <li key={i.nome} className="flex flex-col rounded-xl bg-superficie p-4">
            <p className="font-medium">{i.nome}</p>
            <p className="mt-1 flex-1 text-xs text-texto-suave">{i.descricao}</p>
            <p className={`mt-3 text-xs font-medium ${i.ok ? "text-emerald-700" : "text-amber-700"}`}>
              {i.ok ? "✓ " : "• "}
              {i.status}
            </p>
            <a href={i.href} target="_blank" rel="noopener noreferrer" className="botao-secundario mt-3 min-h-10 px-4 text-xs">
              {i.acao} ↗
            </a>
          </li>
        ))}
      </ul>
      {(!searchConsole || !analytics) && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-destaque">Como conseguir os códigos</summary>
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-texto-suave">
            <li>
              <strong>Search Console:</strong> adicione a propriedade do tipo &ldquo;Prefixo do URL&rdquo; com o endereço do site, escolha
              &ldquo;Tag HTML&rdquo; e copie o valor de <code>content</code>. Cole em Editar site → SEO e clique em &ldquo;Verificar&rdquo; no Google.
              Depois envie o sitemap: <code>{urlSite.replace(/\/$/, "")}/sitemap.xml</code>.
            </li>
            <li>
              <strong>Analytics:</strong> crie uma propriedade GA4 com um fluxo de dados &ldquo;Web&rdquo; e copie o ID de medição (começa com
              G-). Cole em Editar site → SEO.
            </li>
            <li>
              O Analytics só começa a contar visitas de quem aceitar o aviso de cookies no site (exigência da LGPD).
            </li>
          </ol>
        </details>
      )}
    </section>
  );
}
