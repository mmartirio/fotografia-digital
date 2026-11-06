/**
 * Redimensiona a imagem no navegador antes do envio.
 * - As funções do Netlify aceitam cerca de 6 MB por requisição; fotos de câmera passam disso.
 * - Fotos menores carregam mais rápido no site (PageSpeed).
 * PNG continua PNG (preserva transparência, ex.: logo); o resto vira JPEG.
 */
export async function redimensionar(arquivo: File, ladoMaximo: number, qualidade = 0.86): Promise<File> {
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  try {
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
    const png = arquivo.type === "image/png";
    // já pequena e em formato aceito: envia como está
    if (escala === 1 && arquivo.size < 3.5 * 1024 * 1024 && (png || arquivo.type === "image/jpeg")) return arquivo;

    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Navegador sem suporte a canvas.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, largura, altura);

    const tipo = png ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipo, png ? undefined : qualidade));
    if (!blob) throw new Error("Não foi possível processar a imagem.");
    const nome = arquivo.name.replace(/\.[^.]+$/, "") + (png ? ".png" : ".jpg");
    return new File([blob], nome, { type: tipo });
  } finally {
    bitmap.close();
  }
}

/** Tamanhos usados pelo painel. */
export const LADO_FOTO = 2400;
export const LADO_MINIATURA = 800;
export const LADO_LOGO = 512;
