import { restaurarSecao, salvarSecao } from "@/servidor/conteudo";
import { atualizarSite, exigirAdmin, lerJson, rota } from "@/servidor/http";

type Ctx = { params: Promise<{ chave: string }> };

export const PUT = rota(async (req: Request, { params }: Ctx) => {
  await exigirAdmin(req);
  await salvarSecao((await params).chave, await lerJson<unknown>(req, 100_000));
  atualizarSite();
  return new Response(null, { status: 204 });
});

export const DELETE = rota(async (req: Request, { params }: Ctx) => {
  await exigirAdmin(req);
  await restaurarSecao((await params).chave);
  atualizarSite();
  return new Response(null, { status: 204 });
});
