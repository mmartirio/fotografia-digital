import { receberImagem } from "@/servidor/armazenamento";
import { exigirAdmin, json, rota } from "@/servidor/http";

/** Logo (também usada como favicon). Quem salva a seção "Aparência" é o editor. */
export const POST = rota(async (req: Request) => {
  await exigirAdmin(req);
  const form = await req.formData();
  return json(await receberImagem("site", form.get("arquivo")), 201);
});
