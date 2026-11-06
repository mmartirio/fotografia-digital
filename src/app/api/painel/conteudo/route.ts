import { secoesSalvas } from "@/servidor/conteudo";
import { exigirAdmin, json, rota } from "@/servidor/http";

export const GET = rota(async (req: Request) => {
  await exigirAdmin(req);
  return json(await secoesSalvas());
});
