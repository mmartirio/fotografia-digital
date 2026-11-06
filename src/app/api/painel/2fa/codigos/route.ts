import { novosCodigos } from "@/servidor/acesso";
import { exigirAdmin, json, lerJson, rota, texto } from "@/servidor/http";

export const POST = rota(async (req: Request) => {
  const u = await exigirAdmin(req);
  const d = await lerJson(req, 5_000);
  return json({ codigosRecuperacao: await novosCodigos(u, texto(d.codigo)) });
});
