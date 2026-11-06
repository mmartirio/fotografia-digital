import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança em todas as respostas.
 * - frame-ancestors/X-Frame-Options: ninguém pode embutir o site num iframe (clickjacking no painel).
 * - nosniff: o navegador não "adivinha" o tipo dos arquivos.
 * - Referrer-Policy: links externos não recebem o caminho completo.
 * - Permissions-Policy: o site não usa câmera, microfone nem localização.
 * - HSTS: só tem efeito quando servido em HTTPS.
 */
const cabecalhosSeguranca = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // PGlite (banco local de desenvolvimento) carrega arquivos .wasm: fica fora do bundle
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  experimental: {
    // CSS embutido no HTML: elimina a requisição que bloqueava a primeira pintura (PageSpeed)
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Mobile first: tamanhos começando em telas pequenas
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1600, 1920],
  },
  async headers() {
    return [{ source: "/:caminho*", headers: cabecalhosSeguranca }];
  },
};

export default nextConfig;
