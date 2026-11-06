/**
 * URL interna do backend (rede Docker). Só usada no servidor:
 * o navegador sempre fala com /api/* do próprio Next, que faz o proxy.
 */
export function backendUrl(caminho: string): string {
  const base = process.env.BACKEND_URL ?? "http://localhost:8080";
  return new URL(caminho, base).toString();
}

export function siteUrl(): URL {
  return new URL(process.env.SITE_URL ?? "http://localhost:3000");
}
