import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Arquivos de imagem do site.
 * - Produção (Vercel): Vercel Blob (BLOB_READ_WRITE_TOKEN, criado ao conectar o Blob ao projeto).
 * - Desenvolvimento: sem token, grava em public/uploads (servido pelo próprio Next).
 * As imagens chegam já redimensionadas pelo navegador (limite de 4,5 MB por requisição no Vercel).
 */

export const TAMANHO_MAXIMO = 4 * 1024 * 1024;
const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export class ArquivoInvalido extends Error {}

/** Confere tipo declarado, tamanho e a "assinatura" real dos bytes (não confia só na extensão). */
export async function validarImagem(arquivo: File): Promise<{ bytes: Buffer; extensao: string; tipo: string }> {
  const extensao = TIPOS[arquivo.type];
  if (!extensao) throw new ArquivoInvalido("Formato não suportado. Envie JPG, PNG ou WebP.");
  if (arquivo.size > TAMANHO_MAXIMO) throw new ArquivoInvalido("Imagem grande demais (máximo 4 MB após o redimensionamento).");
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  const confere = (extensao === "jpg" && jpeg) || (extensao === "png" && png) || (extensao === "webp" && webp);
  if (!confere) throw new ArquivoInvalido("O arquivo não é uma imagem válida.");
  return { bytes, extensao, tipo: arquivo.type };
}

/** Largura × altura lidas do cabeçalho do arquivo (JPEG, PNG ou WebP), sem bibliotecas nativas. */
export function dimensoes(b: Buffer): { largura: number; altura: number } {
  if (b[0] === 0x89 && b[1] === 0x50) return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) };
  if (b.subarray(0, 4).toString("ascii") === "RIFF") {
    const tipo = b.subarray(12, 16).toString("ascii");
    if (tipo === "VP8X") return { largura: 1 + b.readUIntLE(24, 3), altura: 1 + b.readUIntLE(27, 3) };
    if (tipo === "VP8L") {
      const v = b.readUInt32LE(21);
      return { largura: 1 + (v & 0x3fff), altura: 1 + ((v >> 14) & 0x3fff) };
    }
    if (tipo === "VP8 ") return { largura: b.readUInt16LE(26) & 0x3fff, altura: b.readUInt16LE(28) & 0x3fff };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marcador = b[i + 1];
      // SOF0..SOF15 (exceto DHT=C4, JPG=C8, DAC=CC) trazem as dimensões
      if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
        return { altura: b.readUInt16BE(i + 5), largura: b.readUInt16BE(i + 7) };
      }
      if (marcador === 0xd8 || marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) {
        i += 2;
        continue;
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  throw new ArquivoInvalido("Não foi possível ler as dimensões da imagem.");
}

/** Valida, salva e devolve URL + dimensões. */
export async function receberImagem(pasta: "site" | "portfolio", arquivo: unknown) {
  if (!(arquivo instanceof File)) throw new ArquivoInvalido("Envie a imagem no campo \"arquivo\".");
  const { bytes, extensao, tipo } = await validarImagem(arquivo);
  const { largura, altura } = dimensoes(bytes);
  if (largura * altura > 40_000_000) throw new ArquivoInvalido("Imagem com resolução grande demais.");
  const src = await salvarImagem(pasta, `${crypto.randomUUID()}.${extensao}`, bytes, tipo);
  return { src, largura, altura };
}

/** Salva e devolve a URL pública. `nome` deve ser único (ex.: UUID). */
export async function salvarImagem(pasta: "site" | "portfolio", nome: string, bytes: Buffer, tipo: string): Promise<string> {
  const caminho = `${pasta}/${nome}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const r = await put(caminho, bytes, {
      access: "public",
      contentType: tipo,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000, // nomes únicos: o arquivo nunca muda
    });
    return r.url;
  }
  const destino = path.join(process.cwd(), "public", "uploads", pasta, nome);
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.writeFile(destino, bytes);
  return `/uploads/${caminho}`;
}

export async function excluirImagem(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("https://") && process.env.BLOB_READ_WRITE_TOKEN) {
      const { del } = await import("@vercel/blob");
      await del(url);
    } else if (url.startsWith("/uploads/")) {
      const alvo = path.normalize(path.join(process.cwd(), "public", url));
      // só apaga dentro de public/uploads (proteção contra path traversal)
      if (alvo.startsWith(path.join(process.cwd(), "public", "uploads"))) await fs.unlink(alvo);
    }
  } catch {
    // arquivo já removido: nada a fazer
  }
}
