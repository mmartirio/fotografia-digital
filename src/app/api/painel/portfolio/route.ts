import { receberImagem } from "@/servidor/armazenamento";
import { adicionarFoto, listarPortfolio } from "@/servidor/conteudo";
import { atualizarSite, exigirAdmin, json, rota, texto } from "@/servidor/http";

export const GET = rota(async (req: Request) => {
  await exigirAdmin(req);
  return json(await listarPortfolio());
});

/** Campos: arquivo (foto, já redimensionada no navegador), miniatura (opcional), categoria, alt. */
export const POST = rota(async (req: Request) => {
  await exigirAdmin(req);
  const form = await req.formData();
  const foto = await receberImagem("portfolio", form.get("arquivo"));
  const mini = form.get("miniatura") instanceof File ? await receberImagem("portfolio", form.get("miniatura")) : null;
  const nova = await adicionarFoto({
    src: foto.src,
    miniatura: mini?.src ?? foto.src,
    largura: foto.largura,
    altura: foto.altura,
    alt: texto(form.get("alt")),
    categoria: texto(form.get("categoria")),
  });
  atualizarSite();
  return json(nova, 201);
});
