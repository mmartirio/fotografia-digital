import { describe, expect, it } from "vitest";
import {
  base32,
  base32Decodificar,
  cifrar,
  codigoTotp,
  decifrar,
  hashToken,
  passoTotp,
  verificarTotp,
} from "@/servidor/cripto";

// Segredo do apêndice B da RFC 6238 ("12345678901234567890" em ASCII)
const SEGREDO_RFC = base32(Buffer.from("12345678901234567890"));

describe("TOTP (RFC 6238)", () => {
  it("bate com os vetores oficiais (SHA1, 8 dígitos)", () => {
    expect(SEGREDO_RFC).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(codigoTotp(SEGREDO_RFC, passoTotp(59_000), 8)).toBe("94287082");
    expect(codigoTotp(SEGREDO_RFC, passoTotp(1_111_111_109_000), 8)).toBe("07081804");
    expect(codigoTotp(SEGREDO_RFC, passoTotp(1_234_567_890_000), 8)).toBe("89005924");
  });

  it("aceita ±1 passo de relógio e recusa fora da janela", () => {
    const agora = 1_700_000_000_000;
    const p = passoTotp(agora);
    expect(verificarTotp(SEGREDO_RFC, codigoTotp(SEGREDO_RFC, p), null, agora)).toBe(p);
    expect(verificarTotp(SEGREDO_RFC, codigoTotp(SEGREDO_RFC, p - 1), null, agora)).toBe(p - 1);
    expect(verificarTotp(SEGREDO_RFC, codigoTotp(SEGREDO_RFC, p + 1), null, agora)).toBe(p + 1);
    expect(verificarTotp(SEGREDO_RFC, codigoTotp(SEGREDO_RFC, p - 3), null, agora)).toBeNull();
    expect(verificarTotp(SEGREDO_RFC, "abc123", null, agora)).toBeNull();
  });

  it("não aceita de novo um passo já usado (anti-replay)", () => {
    const agora = 1_700_000_000_000;
    const p = passoTotp(agora);
    expect(verificarTotp(SEGREDO_RFC, codigoTotp(SEGREDO_RFC, p), p, agora)).toBeNull();
  });

  it("base32 ida e volta", () => {
    const b = Buffer.from([0, 1, 2, 250, 255, 7, 99]);
    expect(base32Decodificar(base32(b)).equals(b)).toBe(true);
  });
});

describe("AES-256-GCM", () => {
  it("cifra e decifra; recusa texto adulterado", () => {
    const c = cifrar("segredo");
    expect(c).not.toContain("segredo");
    expect(decifrar(c)).toBe("segredo");
    const bytes = Buffer.from(c, "base64");
    bytes[bytes.length - 1] ^= 1;
    expect(() => decifrar(bytes.toString("base64"))).toThrow();
  });

  it("hash de token é determinístico e não revela o token", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).toHaveLength(64);
  });
});
