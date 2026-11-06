import { describe, expect, it } from "vitest";
import {
  ativarDoisFatores,
  configurarDoisFatores,
  confirmarSegundoFator,
  desativarDoisFatores,
  encerrarSessao,
  entrar,
  porId,
  trocarSenha,
  usuarioDaSessao,
  type Usuario,
} from "@/servidor/acesso";
import { codigoTotp, passoTotp } from "@/servidor/cripto";
import { sql } from "@/servidor/db";

const EMAIL = "admin@teste.local";
const SENHA = "senha-de-teste-123";

async function logado(): Promise<Usuario> {
  const r = await entrar(EMAIL, SENHA);
  if (r.tipo !== "ok") throw new Error(`login falhou: ${r.tipo}`);
  return (await usuarioDaSessao(r.token))!;
}

describe("login do painel", () => {
  it("cria o administrador a partir das variáveis e entra com a senha certa", async () => {
    const r = await entrar(EMAIL.toUpperCase(), SENHA);
    expect(r.tipo).toBe("ok");
    if (r.tipo !== "ok") return;
    const u = await usuarioDaSessao(r.token);
    expect(u?.nome).toBe("Admin Teste");
    await encerrarSessao(r.token);
    expect(await usuarioDaSessao(r.token)).toBeNull();
  });

  it("recusa senha errada e e-mail inexistente da mesma forma", async () => {
    expect((await entrar(EMAIL, "errada")).tipo).toBe("invalido");
    expect((await entrar("ninguem@teste.local", SENHA)).tipo).toBe("invalido");
    expect(await usuarioDaSessao("token-inventado")).toBeNull();
    await sql("DELETE FROM tentativa_login");
  });

  it("bloqueia após 5 falhas, mesmo com a senha certa", async () => {
    for (let i = 0; i < 5; i++) await entrar(EMAIL, "errada");
    expect((await entrar(EMAIL, SENHA)).tipo).toBe("bloqueado");
    await sql("DELETE FROM tentativa_login");
    expect((await entrar(EMAIL, SENHA)).tipo).toBe("ok");
  });

  it("troca de senha exige a atual e mínimo de 8 caracteres", async () => {
    const u = await logado();
    await expect(trocarSenha(u, "errada", "nova-senha-123")).rejects.toThrow("Senha atual incorreta");
    await expect(trocarSenha(u, SENHA, "curta")).rejects.toThrow("8 caracteres");
    await trocarSenha(u, SENHA, "nova-senha-123");
    expect((await entrar(EMAIL, "nova-senha-123")).tipo).toBe("ok");
    await trocarSenha((await porId(u.id))!, "nova-senha-123", SENHA);
  });
});

describe("verificação em duas etapas", () => {
  it("ciclo completo: configurar, ativar, login com código, anti-replay, recuperação e desativar", async () => {
    let u = await logado();
    await expect(configurarDoisFatores(u, "errada", "Teste")).rejects.toThrow("Senha incorreta");
    const cfg = await configurarDoisFatores(u, SENHA, "Teste");
    expect(cfg.qrCode).toMatch(/^data:image\/png;base64,/);
    const segredo = cfg.segredo.replace(/\s/g, "");

    u = (await porId(u.id))!;
    await expect(ativarDoisFatores(u, "000000")).rejects.toThrow("Código incorreto");
    const passoAtivacao = passoTotp();
    const recuperacao = await ativarDoisFatores(u, codigoTotp(segredo, passoAtivacao));
    expect(recuperacao).toHaveLength(10);
    expect(recuperacao[0]).toMatch(/^[2-9A-Z]{5}-[2-9A-Z]{5}$/);

    // senha agora só gera o desafio
    const etapa1 = await entrar(EMAIL, SENHA);
    expect(etapa1.tipo).toBe("segundo-fator");
    if (etapa1.tipo !== "segundo-fator") return;

    // o mesmo código da ativação não vale de novo (anti-replay)
    expect((await confirmarSegundoFator(etapa1.desafio, codigoTotp(segredo, passoAtivacao))).tipo).toBe("invalido");
    await sql("DELETE FROM tentativa_login");

    // código de recuperação funciona uma única vez
    expect((await confirmarSegundoFator(etapa1.desafio, recuperacao[0].toLowerCase())).tipo).toBe("ok");
    const etapa2 = await entrar(EMAIL, SENHA);
    if (etapa2.tipo !== "segundo-fator") throw new Error("esperava desafio");
    expect((await confirmarSegundoFator(etapa2.desafio, recuperacao[0])).tipo).toBe("invalido");

    // desafio inexistente/expirado pede para recomeçar
    expect((await confirmarSegundoFator("inventado", "123456")).tipo).toBe("expirado");

    // desativar exige senha + código
    u = (await porId(u.id))!;
    await expect(desativarDoisFatores(u, SENHA, "000000")).rejects.toThrow("Código incorreto");
    await desativarDoisFatores(u, SENHA, recuperacao[1]);
    await sql("DELETE FROM tentativa_login");
    expect((await entrar(EMAIL, SENHA)).tipo).toBe("ok");
  });

  it("desafio é encerrado após 5 códigos errados", async () => {
    let u = await logado();
    const cfg = await configurarDoisFatores(u, SENHA, "Teste");
    u = (await porId(u.id))!;
    const codigos = await ativarDoisFatores(u, codigoTotp(cfg.segredo.replace(/\s/g, ""), passoTotp()));
    const etapa = await entrar(EMAIL, SENHA);
    if (etapa.tipo !== "segundo-fator") throw new Error("esperava desafio");
    for (let i = 0; i < 4; i++) {
      expect((await confirmarSegundoFator(etapa.desafio, "000000")).tipo).toBe("invalido");
      await sql("DELETE FROM tentativa_login"); // isola o limite por desafio do bloqueio da conta
    }
    expect((await confirmarSegundoFator(etapa.desafio, "000000")).tipo).toBe("invalido");
    expect((await confirmarSegundoFator(etapa.desafio, codigos[0])).tipo).toBe("expirado");
  });
});
