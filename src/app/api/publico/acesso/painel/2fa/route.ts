import { confirmarSegundoFator } from "@/servidor/acesso";
import { definirCookieSessao, erro, exigirMesmaOrigem, json, lerJson, rota, texto } from "@/servidor/http";

export const POST = rota(async (req: Request) => {
  exigirMesmaOrigem(req);
  const d = await lerJson(req, 5_000);
  const r = await confirmarSegundoFator(texto(d.desafio).slice(0, 100), texto(d.codigo).slice(0, 20));
  if (r.tipo === "expirado") return erro("A verificação expirou. Entre com e-mail e senha de novo.", 401, { reiniciar: "true" });
  if (r.tipo === "bloqueado") return erro("Muitas tentativas. Aguarde 15 minutos e tente de novo.", 429);
  if (r.tipo !== "ok") return erro("Código incorreto.", 401);
  await definirCookieSessao(r.token);
  return json({ status: "ok" });
});
