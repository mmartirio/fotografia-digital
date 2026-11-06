/**
 * URL pública do site (SEO, sitemap, links do painel).
 * Ordem: SITE_URL (domínio próprio) → domínio de produção do Vercel → URL do deploy → localhost.
 */
export function siteUrl(): URL {
  const definida = process.env.SITE_URL?.trim();
  if (definida) return new URL(definida);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
