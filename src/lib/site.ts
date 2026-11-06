/**
 * URL pública do site (SEO, sitemap, links do painel).
 * Ordem: SITE_URL (domínio próprio) → URL principal do site no Netlify → localhost.
 */
export function siteUrl(): URL {
  const definida = process.env.SITE_URL?.trim();
  if (definida) return new URL(definida);
  // URL: variável do Netlify com o endereço principal (domínio próprio ou *.netlify.app)
  if (process.env.URL) return new URL(process.env.URL);
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
