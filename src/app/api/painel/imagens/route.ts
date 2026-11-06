import { receberImagem } from "@/servidor/armazenamento";
import { exigirAdmin, json, rota } from "@/servidor/http";

/** Imagens das seções do site (topo, sobre, chamada final...). */
export const POST = rota(async (req: Request) => {
  await exigirAdmin(req);
  const form = await req.formData();
  return json(await receberImagem("site", form.get("arquivo")), 201);
});
