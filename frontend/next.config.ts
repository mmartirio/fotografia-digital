import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone: imagem Docker enxuta (só node + server.js)
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Mobile first: tamanhos começando em telas pequenas
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1600, 1920],
  },
};

export default nextConfig;
