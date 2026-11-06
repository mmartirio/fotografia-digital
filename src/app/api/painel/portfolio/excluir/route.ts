import { excluirFotos } from "@/servidor/conteudo";
import { atualizarSite, exigirAdmin, json, lerJson, rota } from "@/servidor/http";

/** Exclusão em lote: { ids: string[] } */
export const POST = rota(async (req: Request) => {
  await exigirAdmin(req);
  const { ids } = await lerJson<{ ids?: unknown }>(req, 50_000);
  const total = await excluirFotos(ids);
  atualizarSite();
  return json({ total });
});
