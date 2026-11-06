import { desativarDoisFatores } from "@/servidor/acesso";
import { exigirAdmin, lerJson, rota, texto } from "@/servidor/http";

export const POST = rota(async (req: Request) => {
  const u = await exigirAdmin(req);
  const d = await lerJson(req, 5_000);
  await desativarDoisFatores(u, texto(d.senha), texto(d.codigo));
  return new Response(null, { status: 204 });
});
