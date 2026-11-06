import { editarFoto, excluirFoto } from "@/servidor/conteudo";
import { atualizarSite, erro, exigirAdmin, json, lerJson, rota } from "@/servidor/http";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PUT = rota(async (req: Request, { params }: Ctx) => {
  await exigirAdmin(req);
  const { id } = await params;
  if (!UUID.test(id)) return erro("Foto não encontrada.", 404);
  const f = await editarFoto(id, await lerJson(req, 5_000));
  atualizarSite();
  return json(f);
});

export const DELETE = rota(async (req: Request, { params }: Ctx) => {
  await exigirAdmin(req);
  const { id } = await params;
  if (!UUID.test(id)) return erro("Foto não encontrada.", 404);
  await excluirFoto(id);
  atualizarSite();
  return new Response(null, { status: 204 });
});
