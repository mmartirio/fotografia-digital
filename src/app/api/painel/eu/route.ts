import { exigirAdmin, json, rota } from "@/servidor/http";

export const GET = rota(async (req: Request) => {
  const u = await exigirAdmin(req);
  return json({ id: u.id, nome: u.nome, email: u.email, doisFatores: u.totp_ativo });
});
