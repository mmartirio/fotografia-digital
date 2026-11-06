import type { NextRequest } from "next/server";
import { backendUrl } from "@/lib/backend";

/**
 * Proxy /api/* → backend. Mantém o backend fora da internet (só o frontend
 * expõe porta) e evita CORS. Corpo é repassado em streaming, então uploads
 * grandes não ficam em memória.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cabeçalhos hop-by-hop ou que o fetch recalcula
const BLOQUEADOS_REQUISICAO = new Set(["host", "connection", "content-length", "keep-alive", "transfer-encoding"]);
const BLOQUEADOS_RESPOSTA = new Set(["content-encoding", "content-length", "transfer-encoding", "connection"]);

async function proxy(req: NextRequest): Promise<Response> {
  const destino = backendUrl(req.nextUrl.pathname + req.nextUrl.search);

  const headers = new Headers();
  req.headers.forEach((valor, chave) => {
    if (!BLOQUEADOS_REQUISICAO.has(chave.toLowerCase())) headers.set(chave, valor);
  });
  // Atrás de um proxy HTTPS (Caddy/Nginx/Cloudflare) o protocolo real vem em x-forwarded-proto
  headers.set("x-forwarded-host", req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "");
  headers.set("x-forwarded-proto", req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", ""));

  const temCorpo = req.method !== "GET" && req.method !== "HEAD";

  let resposta: Response;
  try {
    resposta = await fetch(destino, {
      method: req.method,
      headers,
      body: temCorpo ? req.body : undefined,
      redirect: "manual",
      cache: "no-store",
      // Necessário para enviar ReadableStream como corpo no Node
      ...(temCorpo ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return Response.json({ erro: "Serviço indisponível" }, { status: 502 });
  }

  const headersResposta = new Headers();
  resposta.headers.forEach((valor, chave) => {
    if (!BLOQUEADOS_RESPOSTA.has(chave.toLowerCase())) headersResposta.append(chave, valor);
  });

  return new Response(resposta.body, { status: resposta.status, headers: headersResposta });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
