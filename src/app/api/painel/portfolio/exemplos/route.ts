import { conteudoPadrao } from "@/conteudo/padrao";
import { importarExemplos } from "@/servidor/conteudo";
import { atualizarSite, exigirAdmin, json, rota } from "@/servidor/http";

/** Torna as fotos de exemplo editáveis (copia para o banco). */
export const POST = rota(async (req: Request) => {
  await exigirAdmin(req);
  const total = await importarExemplos(conteudoPadrao.portfolio.fotos);
  atualizarSite();
  return json({ total }, 201);
});
