/**
 * Remove o fundo branco de uma logo no navegador, antes do envio.
 * Preenche a partir das bordas (só o fundo some; brancos internos da logo ficam)
 * e suaviza o contorno ajustando a transparência dos pixels claros da borda.
 */
export async function removerFundoBranco(arquivo: File, limiar = 150): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const W = Math.round(bitmap.width * escala);
  const H = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, W, H);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const claro = (p: number) => Math.min(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]);

  const visitado = new Uint8Array(W * H);
  const pilha: number[] = [];
  for (let x = 0; x < W; x++) pilha.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) pilha.push(y * W, y * W + W - 1);

  while (pilha.length) {
    const p = pilha.pop()!;
    if (visitado[p]) continue;
    visitado[p] = 1;
    const l = claro(p);
    if (l < limiar) continue; // chegou no desenho: para aqui
    // branco puro some; tons intermediários (antisserrilhado) ficam semitransparentes
    const alfa = Math.max(0, Math.min(1, (255 - l) / (255 - limiar)));
    d[p * 4 + 3] = Math.round(d[p * 4 + 3] * alfa);
    const x = p % W;
    const y = (p / W) | 0;
    if (x > 0 && !visitado[p - 1]) pilha.push(p - 1);
    if (x < W - 1 && !visitado[p + 1]) pilha.push(p + 1);
    if (y > 0 && !visitado[p - W]) pilha.push(p - W);
    if (y < H - 1 && !visitado[p + W]) pilha.push(p + W);
  }
  ctx.putImageData(img, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao processar a imagem."))), "image/png"));
}
