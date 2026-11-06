/**
 * Acesso ao banco Postgres.
 * - Produção (Netlify): DATABASE_URL (Neon) ou NETLIFY_DATABASE_URL (Netlify DB) → driver "postgres".
 * - Desenvolvimento e testes: sem DATABASE_URL → PGlite (Postgres em WebAssembly, dentro do Node),
 *   gravado em .dados/pglite (ou em memória com PGLITE_DIR=memory://). Não precisa de Docker.
 * O esquema é criado/atualizado automaticamente no primeiro acesso (idempotente).
 */
import { ESQUEMA, semearAdministrador } from "./esquema";

export interface Banco {
  consulta<T = Record<string, unknown>>(sql: string, parametros?: unknown[]): Promise<T[]>;
}

declare global {
  // Mantém uma conexão por processo (inclusive entre recargas do `next dev`)
  var __bancoFotografia: Promise<Banco> | undefined;
}

async function conectar(): Promise<Banco> {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  let banco: Banco;

  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, {
      // conexões curtas em funções serverless; pooler do Neon (pgbouncer) não aceita prepared statements
      max: 3,
      idle_timeout: 20,
      prepare: false,
      ssl: /sslmode=disable|localhost|127\.0\.0\.1/.test(url) ? false : "require",
    });
    banco = {
      consulta: async <T>(texto: string, parametros: unknown[] = []) =>
        (await sql.unsafe(texto, parametros as never[])) as unknown as T[],
    };
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = process.env.PGLITE_DIR || ".dados/pglite";
    if (!dir.includes("://")) (await import("node:fs")).mkdirSync(dir, { recursive: true });
    const db = new PGlite(dir);
    await db.waitReady;
    banco = {
      consulta: async <T>(texto: string, parametros: unknown[] = []) => (await db.query<T>(texto, parametros)).rows,
    };
  }

  for (const comando of ESQUEMA) await banco.consulta(comando);
  await semearAdministrador(banco);
  return banco;
}

export function banco(): Promise<Banco> {
  globalThis.__bancoFotografia ??= conectar().catch((e) => {
    globalThis.__bancoFotografia = undefined; // permite tentar de novo na próxima requisição
    throw e;
  });
  return globalThis.__bancoFotografia;
}

/** Atalho: uma consulta no banco padrão. */
export async function sql<T = Record<string, unknown>>(texto: string, parametros: unknown[] = []): Promise<T[]> {
  return (await banco()).consulta<T>(texto, parametros);
}
