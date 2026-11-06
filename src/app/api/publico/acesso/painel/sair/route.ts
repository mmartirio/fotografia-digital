import { cookies } from "next/headers";
import { encerrarSessao } from "@/servidor/acesso";
import { apagarCookieSessao, COOKIE_SESSAO, exigirMesmaOrigem, rota } from "@/servidor/http";

export const POST = rota(async (req: Request) => {
  exigirMesmaOrigem(req);
  await encerrarSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  await apagarCookieSessao();
  return new Response(null, { status: 204 });
});
