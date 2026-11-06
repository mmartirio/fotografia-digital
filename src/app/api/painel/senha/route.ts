import { trocarSenha } from "@/servidor/acesso";
import { exigirAdmin, lerJson, rota, texto } from "@/servidor/http";

export const POST = rota(async (req: Request) => {
  const u = await exigirAdmin(req);
  const d = await lerJson(req, 5_000);
  await trocarSenha(u, texto(d.senhaAtual), texto(d.novaSenha).slice(0, 200));
  return new Response(null, { status: 204 });
});
