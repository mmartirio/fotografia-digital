import crypto from "node:crypto";

/** Token opaco de 256 bits (cookies de sessão, desafios do 2FA). */
export function gerarToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Hash SHA-256 (hex): só ele é guardado no banco. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ---- AES-256-GCM para segredos guardados no banco (2FA) ------------------------------

let avisouChaveDev = false;

function chave(): Buffer {
  const base64 = process.env.APP_CHAVE_CRIPTO?.trim();
  if (base64) {
    const k = Buffer.from(base64, "base64");
    if (k.length !== 32) throw new Error("APP_CHAVE_CRIPTO deve ter 32 bytes em Base64 (openssl rand -base64 32)");
    return k;
  }
  // em produção a chave é obrigatória (o CI roda "next start" sem ela, por isso a exceção)
  if (process.env.NODE_ENV === "production" && !process.env.CI) {
    throw new Error("Defina APP_CHAVE_CRIPTO nas variáveis de ambiente do Netlify (openssl rand -base64 32).");
  }
  if (!avisouChaveDev) {
    console.warn("[cripto] APP_CHAVE_CRIPTO não definida: usando chave de DESENVOLVIMENTO. Nunca use assim em produção.");
    avisouChaveDev = true;
  }
  return crypto.createHash("sha256").update("chave-de-desenvolvimento-davifotovideo").digest();
}

export function cifrar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), dados]).toString("base64");
}

export function decifrar(base64: string): string {
  const tudo = Buffer.from(base64, "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", chave(), tudo.subarray(0, 12));
  d.setAuthTag(tudo.subarray(12, 28));
  return Buffer.concat([d.update(tudo.subarray(28)), d.final()]).toString("utf8");
}

// ---- TOTP (RFC 6238): HMAC-SHA1, 6 dígitos, passo de 30 s ----------------------------

const ALFABETO_BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TOTP_DIGITOS = 6;
export const TOTP_PASSO = 30;
const TOTP_JANELA = 1; // aceita ±30 s de diferença de relógio

export function base32(dados: Buffer): string {
  let saida = "";
  let buffer = 0;
  let bits = 0;
  for (const b of dados) {
    buffer = (buffer << 8) | b;
    bits += 8;
    while (bits >= 5) {
      saida += ALFABETO_BASE32[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) saida += ALFABETO_BASE32[(buffer << (5 - bits)) & 31];
  return saida;
}

export function base32Decodificar(texto: string): Buffer {
  const limpo = texto.replace(/[\s=]/g, "").toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of limpo) {
    const v = ALFABETO_BASE32.indexOf(ch);
    if (v < 0) throw new Error("Base32 inválido");
    buffer = (buffer << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function novoSegredoTotp(): string {
  return base32(crypto.randomBytes(20));
}

export function passoTotp(instante = Date.now()): number {
  return Math.floor(instante / 1000 / TOTP_PASSO);
}

export function codigoTotp(segredo: string, passo: number, digitos = TOTP_DIGITOS): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(passo));
  const h = crypto.createHmac("sha1", base32Decodificar(segredo)).update(msg).digest();
  const o = h[h.length - 1] & 0x0f;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digitos).padStart(digitos, "0");
}

/**
 * Verifica o código e devolve o passo que casou (para bloquear reuso), ou null.
 * Só aceita passos estritamente posteriores ao último usado (anti-replay).
 */
export function verificarTotp(segredo: string, informado: string, ultimoPassoUsado: number | null, instante = Date.now()): number | null {
  const codigo = (informado ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(codigo)) return null;
  const atual = passoTotp(instante);
  for (let p = atual - TOTP_JANELA; p <= atual + TOTP_JANELA; p++) {
    if (ultimoPassoUsado !== null && p <= ultimoPassoUsado) continue;
    const esperado = Buffer.from(codigoTotp(segredo, p));
    if (crypto.timingSafeEqual(esperado, Buffer.from(codigo))) return p;
  }
  return null;
}

export function uriTotp(emissor: string, conta: string, segredo: string): string {
  const e = encodeURIComponent(emissor);
  return `otpauth://totp/${e}:${encodeURIComponent(conta)}?secret=${segredo}&issuer=${e}&algorithm=SHA1&digits=${TOTP_DIGITOS}&period=${TOTP_PASSO}`;
}
