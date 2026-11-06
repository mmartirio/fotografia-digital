import { entrar } from "@/servidor/acesso";
import { definirCookieSessao, erro, exigirMesmaOrigem, json, lerJson, rota, texto } from "@/servidor/http";

export const POST = rota(async (req: Request) => {
  exigirMesmaOrigem(req);
  const d = await lerJson(req, 5_000);
  const email = texto(d.email).slice(0, 200);
  const senha = texto(d.senha).slice(0, 200);
  if (!email || !senha) return erro("Informe e-mail e senha.", 400);
  const r = await entrar(email, senha);
  if (r.tipo === "bloqueado") return erro("Muitas tentativas. Aguarde 15 minutos e tente de novo.", 429);
  if (r.tipo === "segundo-fator") return json({ status: "2fa", desafio: r.desafio });
  if (r.tipo !== "ok") return erro("E-mail ou senha incorretos.", 401);
  await definirCookieSessao(r.token);
  return json({ status: "ok" });
});
