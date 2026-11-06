import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import crypto from "node:crypto";
import { sql } from "./db";
import {
  cifrar,
  decifrar,
  gerarToken,
  hashToken,
  novoSegredoTotp,
  uriTotp,
  verificarTotp,
} from "./cripto";

/**
 * Login do painel (e-mail + senha e, se ativada, verificação em duas etapas).
 * - 5 falhas (senha ou código) em 15 min bloqueiam a conta temporariamente;
 * - com 2FA ativo, a senha correta gera um desafio de 5 min (até 5 códigos);
 * - e-mail inexistente paga o mesmo custo de bcrypt (não revela contas pelo tempo de resposta).
 */

export const DURACAO_SESSAO_MS = 7 * 24 * 3600 * 1000;
const JANELA_TENTATIVAS = "15 minutes";
const MAX_TENTATIVAS = 5;
const VALIDADE_DESAFIO = "5 minutes";
const MAX_CODIGOS_POR_DESAFIO = 5;
const QTD_CODIGOS_RECUPERACAO = 10;
const ALFABETO_CODIGOS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // sem 0/O, 1/I/L

export class ErroRegra extends Error {}

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  ativo: boolean;
  totp_segredo: string | null;
  totp_pendente: string | null;
  totp_ativo: boolean;
  totp_ultimo_passo: string | number | null;
};

export type Resultado =
  | { tipo: "ok"; token: string }
  | { tipo: "segundo-fator"; desafio: string }
  | { tipo: "invalido" }
  | { tipo: "bloqueado" }
  | { tipo: "expirado" };

const HASH_FICTICIO = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 10);

async function porEmail(email: string): Promise<Usuario | null> {
  const [u] = await sql<Usuario>("SELECT * FROM usuario WHERE lower(email) = lower($1) AND ativo", [email.trim()]);
  return u ?? null;
}

export async function porId(id: string): Promise<Usuario | null> {
  const [u] = await sql<Usuario>("SELECT * FROM usuario WHERE id = $1 AND ativo", [id]);
  return u ?? null;
}

async function bloqueado(usuarioId: string): Promise<boolean> {
  const [{ total }] = await sql<{ total: number }>(
    `SELECT count(*)::int AS total FROM tentativa_login WHERE usuario_id = $1 AND criado_em > now() - interval '${JANELA_TENTATIVAS}'`,
    [usuarioId],
  );
  return total >= MAX_TENTATIVAS;
}

async function registrarFalha(usuarioId: string) {
  await sql("INSERT INTO tentativa_login (usuario_id) VALUES ($1)", [usuarioId]);
  await sql("DELETE FROM tentativa_login WHERE criado_em < now() - interval '1 day'");
}

async function criarSessao(usuarioId: string): Promise<string> {
  const token = gerarToken();
  await sql("INSERT INTO sessao (usuario_id, token_hash, expira_em) VALUES ($1, $2, now() + ($3 || ' milliseconds')::interval)", [
    usuarioId,
    hashToken(token),
    String(DURACAO_SESSAO_MS),
  ]);
  await sql("DELETE FROM sessao WHERE expira_em < now()");
  return token;
}

/** 1ª etapa: e-mail e senha. */
export async function entrar(email: string, senha: string): Promise<Resultado> {
  const u = await porEmail(email);
  if (!u) {
    await bcrypt.compare(senha, HASH_FICTICIO);
    return { tipo: "invalido" };
  }
  if (await bloqueado(u.id)) return { tipo: "bloqueado" };
  if (!(await bcrypt.compare(senha, u.senha_hash))) {
    await registrarFalha(u.id);
    return { tipo: "invalido" };
  }
  if (u.totp_ativo) {
    const desafio = gerarToken();
    await sql("DELETE FROM desafio_2fa WHERE expira_em < now()");
    await sql(`INSERT INTO desafio_2fa (token_hash, usuario_id, expira_em) VALUES ($1, $2, now() + interval '${VALIDADE_DESAFIO}')`, [
      hashToken(desafio),
      u.id,
    ]);
    return { tipo: "segundo-fator", desafio };
  }
  await sql("DELETE FROM tentativa_login WHERE usuario_id = $1", [u.id]);
  return { tipo: "ok", token: await criarSessao(u.id) };
}

/** 2ª etapa: código do app autenticador (ou de recuperação). */
export async function confirmarSegundoFator(desafio: string, codigo: string): Promise<Resultado> {
  const chave = hashToken(desafio ?? "");
  const [d] = await sql<{ usuario_id: string; vencido: boolean; tentativas: number }>(
    "SELECT usuario_id, expira_em < now() AS vencido, tentativas FROM desafio_2fa WHERE token_hash = $1",
    [chave],
  );
  if (!d || d.vencido) {
    await sql("DELETE FROM desafio_2fa WHERE token_hash = $1", [chave]);
    return { tipo: "expirado" };
  }
  if (await bloqueado(d.usuario_id)) {
    await sql("DELETE FROM desafio_2fa WHERE token_hash = $1", [chave]);
    return { tipo: "bloqueado" };
  }
  const u = await porId(d.usuario_id);
  if (u && (await verificarCodigo(u, codigo))) {
    await sql("DELETE FROM desafio_2fa WHERE token_hash = $1", [chave]);
    await sql("DELETE FROM tentativa_login WHERE usuario_id = $1", [u.id]);
    return { tipo: "ok", token: await criarSessao(u.id) };
  }
  await registrarFalha(d.usuario_id);
  if (d.tentativas + 1 >= MAX_CODIGOS_POR_DESAFIO) await sql("DELETE FROM desafio_2fa WHERE token_hash = $1", [chave]);
  else await sql("UPDATE desafio_2fa SET tentativas = tentativas + 1 WHERE token_hash = $1", [chave]);
  return { tipo: "invalido" };
}

export async function usuarioDaSessao(token: string | undefined): Promise<Usuario | null> {
  if (!token) return null;
  const [u] = await sql<Usuario>(
    "SELECT u.* FROM sessao s JOIN usuario u ON u.id = s.usuario_id WHERE s.token_hash = $1 AND s.expira_em > now() AND u.ativo",
    [hashToken(token)],
  );
  return u ?? null;
}

export async function encerrarSessao(token: string | undefined) {
  if (token) await sql("DELETE FROM sessao WHERE token_hash = $1", [hashToken(token)]);
}

export async function trocarSenha(u: Usuario, senhaAtual: string, novaSenha: string) {
  if (!(await bcrypt.compare(senhaAtual, u.senha_hash))) throw new ErroRegra("Senha atual incorreta.");
  if (novaSenha.length < 8) throw new ErroRegra("A nova senha precisa ter pelo menos 8 caracteres.");
  await sql("UPDATE usuario SET senha_hash = $1 WHERE id = $2", [await bcrypt.hash(novaSenha, 10), u.id]);
}

// ---- verificação em duas etapas ---------------------------------------------------------

export async function statusDoisFatores(u: Usuario) {
  const [{ total }] = await sql<{ total: number }>(
    "SELECT count(*)::int AS total FROM codigo_recuperacao WHERE usuario_id = $1 AND usado_em IS NULL",
    [u.id],
  );
  return { ativo: u.totp_ativo, codigosRestantes: u.totp_ativo ? total : 0 };
}

async function exigirSenha(u: Usuario, senha: string) {
  if (!senha || !(await bcrypt.compare(senha, u.senha_hash))) throw new ErroRegra("Senha incorreta.");
}

export async function configurarDoisFatores(u: Usuario, senha: string, emissor: string) {
  await exigirSenha(u, senha);
  if (u.totp_ativo) throw new ErroRegra("A verificação em duas etapas já está ativa.");
  const segredo = novoSegredoTotp();
  await sql("UPDATE usuario SET totp_pendente = $1 WHERE id = $2", [cifrar(segredo), u.id]);
  const uri = uriTotp(emissor, u.email, segredo);
  return {
    segredo: segredo.replace(/(.{4})(?!$)/g, "$1 "),
    uri,
    qrCode: await QRCode.toDataURL(uri, { width: 240, margin: 2, errorCorrectionLevel: "M" }),
  };
}

export async function ativarDoisFatores(u: Usuario, codigo: string): Promise<string[]> {
  if (u.totp_ativo) throw new ErroRegra("A verificação em duas etapas já está ativa.");
  if (!u.totp_pendente) throw new ErroRegra("Comece a configuração novamente.");
  const passo = verificarTotp(decifrar(u.totp_pendente), codigo, null);
  if (passo === null) throw new ErroRegra("Código incorreto. Confira se o horário do celular está automático e tente de novo.");
  await sql(
    "UPDATE usuario SET totp_segredo = totp_pendente, totp_pendente = NULL, totp_ativo = TRUE, totp_ultimo_passo = $1 WHERE id = $2",
    [passo, u.id],
  );
  return gerarCodigos(u.id);
}

export async function novosCodigos(u: Usuario, codigo: string): Promise<string[]> {
  if (!u.totp_ativo) throw new ErroRegra("A verificação em duas etapas não está ativa.");
  if (!(await verificarCodigo(u, codigo))) throw new ErroRegra("Código incorreto.");
  return gerarCodigos(u.id);
}

export async function desativarDoisFatores(u: Usuario, senha: string, codigo: string) {
  await exigirSenha(u, senha);
  if (!u.totp_ativo) return;
  if (!(await verificarCodigo(u, codigo))) throw new ErroRegra("Código incorreto.");
  await sql(
    "UPDATE usuario SET totp_segredo = NULL, totp_pendente = NULL, totp_ativo = FALSE, totp_ultimo_passo = NULL WHERE id = $1",
    [u.id],
  );
  await sql("DELETE FROM codigo_recuperacao WHERE usuario_id = $1", [u.id]);
}

/** Código do app (6 dígitos, uso único) ou de recuperação (XXXXX-XXXXX, uso único). */
export async function verificarCodigo(u: Usuario, codigo: string): Promise<boolean> {
  if (!u.totp_ativo || !u.totp_segredo || !codigo) return false;
  const limpo = codigo.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{6}$/.test(limpo)) {
    const ultimo = u.totp_ultimo_passo === null ? null : Number(u.totp_ultimo_passo);
    const passo = verificarTotp(decifrar(u.totp_segredo), limpo, ultimo);
    if (passo === null) return false;
    // anti-replay atômico: só grava se ninguém usou um passo igual/posterior antes
    const atualizados = await sql(
      "UPDATE usuario SET totp_ultimo_passo = $1 WHERE id = $2 AND (totp_ultimo_passo IS NULL OR totp_ultimo_passo < $1) RETURNING id",
      [passo, u.id],
    );
    if (atualizados.length === 1) u.totp_ultimo_passo = passo;
    return atualizados.length === 1;
  }
  const usados = await sql(
    "UPDATE codigo_recuperacao SET usado_em = now() WHERE usuario_id = $1 AND codigo_hash = $2 AND usado_em IS NULL RETURNING id",
    [u.id, hashToken(limpo)],
  );
  return usados.length === 1;
}

async function gerarCodigos(usuarioId: string): Promise<string[]> {
  await sql("DELETE FROM codigo_recuperacao WHERE usuario_id = $1", [usuarioId]);
  const codigos: string[] = [];
  for (let i = 0; i < QTD_CODIGOS_RECUPERACAO; i++) {
    let c = "";
    for (let j = 0; j < 10; j++) c += ALFABETO_CODIGOS[crypto.randomInt(ALFABETO_CODIGOS.length)];
    await sql("INSERT INTO codigo_recuperacao (usuario_id, codigo_hash) VALUES ($1, $2)", [usuarioId, hashToken(c)]);
    codigos.push(`${c.slice(0, 5)}-${c.slice(5)}`);
  }
  return codigos;
}
