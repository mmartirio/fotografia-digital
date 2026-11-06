import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { TAG_CONTEUDO } from "@/conteudo/obter";
import type { NextRequest } from "next/server";
import { DURACAO_SESSAO_MS, ErroRegra, usuarioDaSessao, type Usuario } from "./acesso";
import { ArquivoInvalido } from "./armazenamento";
import { ErroConteudo } from "./conteudo";

export const COOKIE_SESSAO = "fd_painel";

export function json(corpo: unknown, status = 200) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

export function erro(mensagem: string, status: number, extra: Record<string, unknown> = {}) {
  return json({ erro: mensagem, ...extra }, status);
}

/** Converte erros conhecidos em respostas HTTP (mensagem para o usuário em "erro"). */
export function tratarErro(e: unknown): Response {
  if (e instanceof Response) return e;
  if (e instanceof ErroRegra || e instanceof ArquivoInvalido) return erro(e.message, e instanceof ArquivoInvalido ? 422 : 409);
  if (e instanceof ErroConteudo) return erro(e.message, e.status);
  console.error(e);
  return erro("Erro interno.", 500);
}

/**
 * Bloqueia requisições de outro site (CSRF), além do cookie SameSite=Lax:
 * mutações precisam vir da mesma origem do site.
 */
export function exigirMesmaOrigem(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origem = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origem && host && new URL(origem).host !== host) throw erro("Origem não permitida.", 403);
}

export async function definirCookieSessao(token: string) {
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(DURACAO_SESSAO_MS / 1000),
  });
}

export async function apagarCookieSessao() {
  (await cookies()).delete(COOKIE_SESSAO);
}

/** Usuário logado no painel (Server Components e rotas). */
export async function usuarioAtual(): Promise<Usuario | null> {
  return usuarioDaSessao((await cookies()).get(COOKIE_SESSAO)?.value);
}

/** Para rotas do painel: exige sessão válida e mesma origem; senão lança a resposta de erro. */
export async function exigirAdmin(req: NextRequest | Request): Promise<Usuario> {
  exigirMesmaOrigem(req);
  const u = await usuarioAtual();
  if (!u) throw erro("Faça login no painel.", 401);
  return u;
}

/** Envolve um handler de rota: erros lançados viram respostas JSON. */
export function rota<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      return tratarErro(e);
    }
  };
}

/** Depois de alterar conteúdo/portfólio: o site público reflete na hora. */
export function atualizarSite() {
  revalidateTag(TAG_CONTEUDO);
}

/** Campo de texto do corpo (qualquer outro tipo vira ""). */
export const texto = (v: unknown) => (typeof v === "string" ? v : "");

/** Lê JSON do corpo com limite de tamanho. */
export async function lerJson<T = Record<string, unknown>>(req: Request, limite = 200_000): Promise<T> {
  const texto = await req.text();
  if (texto.length > limite) throw erro("Requisição muito grande.", 413);
  try {
    return JSON.parse(texto || "{}") as T;
  } catch {
    throw erro("JSON inválido.", 400);
  }
}
