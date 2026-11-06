import { configurarDoisFatores } from "@/servidor/acesso";
import { obterConteudo } from "@/conteudo/obter";
import { exigirAdmin, json, lerJson, rota, texto } from "@/servidor/http";

export const POST = rota(async (req: Request) => {
  const u = await exigirAdmin(req);
  const d = await lerJson(req, 5_000);
  const { marca } = await obterConteudo();
  return json(await configurarDoisFatores(u, texto(d.senha), `${marca} · Painel`));
});
