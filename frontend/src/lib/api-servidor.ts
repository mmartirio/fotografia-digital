import { cookies } from "next/headers";
import { cache } from "react";
import { backendUrl } from "./backend";

type Resposta = { status: number; dados: unknown };

/** Uma chamada por caminho e por requisição (layout e página compartilham o resultado). */
const buscar = cache(async (caminho: string): Promise<Resposta> => {
  const jar = await cookies();
  const cookie = ["fd_sessao", "fd_painel"]
    .map((n) => jar.get(n))
    .filter((c) => c !== undefined)
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  try {
    const resp = await fetch(backendUrl(caminho), {
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });
    if (!resp.ok) return { status: resp.status, dados: null };
    return { status: resp.status, dados: await resp.json() };
  } catch {
    return { status: 503, dados: null };
  }
});

/**
 * Chamada ao backend a partir de Server Components, repassando os cookies de
 * sessão do usuário (fd_sessao / fd_painel). Nunca usar no navegador.
 */
export async function apiServidor<T>(caminho: string): Promise<{ status: number; dados: T | null }> {
  return (await buscar(caminho)) as { status: number; dados: T | null };
}
