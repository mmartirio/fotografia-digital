import { lerImagem } from "@/servidor/armazenamento";

/**
 * Serve as imagens enviadas pelo painel (Netlify Blobs ou disco local).
 * Os nomes são UUIDs únicos: o arquivo nunca muda, então pode ficar em cache "para sempre".
 */
export async function GET(_req: Request, { params }: { params: Promise<{ chave: string[] }> }) {
  const imagem = await lerImagem((await params).chave.join("/"));
  if (!imagem) return new Response("Imagem não encontrada", { status: 404 });
  return new Response(new Uint8Array(imagem.bytes), {
    headers: {
      "Content-Type": imagem.tipo,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
