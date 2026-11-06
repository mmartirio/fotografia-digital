import bcrypt from "bcryptjs";
import type { Banco } from "./db";

/**
 * Esquema do banco (idempotente: pode rodar a cada inicialização).
 * Segredos do 2FA ficam cifrados (AES-256-GCM); senhas com bcrypt; tokens só como hash SHA-256.
 */
export const ESQUEMA = [
  `CREATE TABLE IF NOT EXISTS usuario (
     id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     nome              VARCHAR(120) NOT NULL,
     email             VARCHAR(180) NOT NULL UNIQUE,
     senha_hash        VARCHAR(255) NOT NULL,
     ativo             BOOLEAN      NOT NULL DEFAULT TRUE,
     totp_segredo      VARCHAR(255),
     totp_pendente     VARCHAR(255),
     totp_ativo        BOOLEAN      NOT NULL DEFAULT FALSE,
     totp_ultimo_passo BIGINT,
     criado_em         TIMESTAMPTZ  NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS codigo_recuperacao (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     usuario_id   UUID        NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
     codigo_hash  VARCHAR(64) NOT NULL,
     usado_em     TIMESTAMPTZ,
     criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (usuario_id, codigo_hash)
   )`,
  `CREATE TABLE IF NOT EXISTS sessao (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     usuario_id  UUID        NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
     token_hash  VARCHAR(64) NOT NULL UNIQUE,
     expira_em   TIMESTAMPTZ NOT NULL,
     criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // Tentativas falhas de login (senha ou código): bloqueio por conta, válido entre instâncias serverless
  `CREATE TABLE IF NOT EXISTS tentativa_login (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     usuario_id  UUID        NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
     criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS ix_tentativa_login ON tentativa_login (usuario_id, criado_em)`,
  // 2ª etapa do login (após senha correta): uso único, 5 min, até 5 códigos
  `CREATE TABLE IF NOT EXISTS desafio_2fa (
     token_hash  VARCHAR(64) PRIMARY KEY,
     usuario_id  UUID        NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
     expira_em   TIMESTAMPTZ NOT NULL,
     tentativas  INTEGER     NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS conteudo_secao (
     chave          VARCHAR(60) PRIMARY KEY,
     conteudo       JSONB       NOT NULL,
     atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS foto_portfolio (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     categoria  VARCHAR(80)  NOT NULL DEFAULT '',
     src        TEXT         NOT NULL,
     miniatura  TEXT         NOT NULL,
     largura    INTEGER      NOT NULL,
     altura     INTEGER      NOT NULL,
     alt        VARCHAR(200) NOT NULL DEFAULT '',
     destaque   BOOLEAN      NOT NULL DEFAULT FALSE,
     ordem      INTEGER      NOT NULL DEFAULT 0,
     criado_em  TIMESTAMPTZ  NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS ix_foto_portfolio_ordem ON foto_portfolio (ordem, criado_em)`,
];

/**
 * Cria o usuário do painel na primeira vez (banco vazio), a partir de ADMIN_EMAIL / ADMIN_SENHA.
 */
export async function semearAdministrador(banco: Banco): Promise<void> {
  const [{ total }] = await banco.consulta<{ total: number }>("SELECT count(*)::int AS total FROM usuario");
  if (total > 0) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA;
  if (!email || !senha) {
    console.warn("[painel] Nenhum usuário cadastrado: defina ADMIN_EMAIL e ADMIN_SENHA para criar o acesso do painel.");
    return;
  }
  await banco.consulta("INSERT INTO usuario (nome, email, senha_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING", [
    process.env.ADMIN_NOME ?? "Davi",
    email,
    await bcrypt.hash(senha, 10),
  ]);
  console.info(`[painel] Usuário do painel criado: ${email}`);
}
