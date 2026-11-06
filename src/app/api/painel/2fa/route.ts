import { statusDoisFatores } from "@/servidor/acesso";
import { exigirAdmin, json, rota } from "@/servidor/http";

export const GET = rota(async (req: Request) => json(await statusDoisFatores(await exigirAdmin(req))));
