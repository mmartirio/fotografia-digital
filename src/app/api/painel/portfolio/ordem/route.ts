import { ordenarPortfolio } from "@/servidor/conteudo";
import { atualizarSite, exigirAdmin, lerJson, rota } from "@/servidor/http";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PUT = rota(async (req: Request) => {
  await exigirAdmin(req);
  const { ids } = await lerJson<{ ids?: unknown }>(req, 50_000);
  await ordenarPortfolio(Array.isArray(ids) ? ids.filter((i) => typeof i === "string" && UUID.test(i)) : ids);
  atualizarSite();
  return new Response(null, { status: 204 });
});
