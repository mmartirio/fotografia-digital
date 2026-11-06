import { describe, expect, it } from "vitest";
import { mesclar } from "@/conteudo/obter";
import { conteudoPadrao } from "@/conteudo/padrao";
import { dimensoes, validarImagem } from "@/servidor/armazenamento";
import {
  adicionarFoto,
  editarFoto,
  excluirFoto,
  listarPortfolio,
  ordenarPortfolio,
  restaurarSecao,
  salvarSecao,
  secoesSalvas,
} from "@/servidor/conteudo";

describe("mesclar conteúdo", () => {
  it("aplica só o que foi salvo e mantém o resto do padrão", () => {
    const c = mesclar(conteudoPadrao, { hero: { titulo: "Novo título" }, rodape: { slogan: "Slogan novo" } }, []);
    expect(c.hero.titulo).toBe("Novo título");
    expect(c.hero.subtitulo).toBe(conteudoPadrao.hero.subtitulo);
    expect(c.slogan).toBe("Slogan novo");
    expect(conteudoPadrao.hero.titulo).not.toBe("Novo título"); // o padrão não é alterado
  });

  it("ignora chaves que alterariam o protótipo", () => {
    const malicioso = JSON.parse('{"__proto__": {"invadido": true}, "titulo": "ok"}');
    const c = mesclar(conteudoPadrao, { hero: malicioso }, []);
    expect(c.hero.titulo).toBe("ok");
    expect(({} as Record<string, unknown>).invadido).toBeUndefined();
  });
});

describe("seções do site no banco", () => {
  it("salva, lê e restaura", async () => {
    await salvarSecao("hero", { titulo: "Salvo" });
    expect((await secoesSalvas()).hero).toEqual({ titulo: "Salvo" });
    await salvarSecao("hero", { titulo: "De novo" });
    expect((await secoesSalvas()).hero).toEqual({ titulo: "De novo" });
    await restaurarSecao("hero");
    expect((await secoesSalvas()).hero).toBeUndefined();
  });

  it("recusa seção desconhecida, não-objeto e conteúdo grande demais", async () => {
    await expect(salvarSecao("menu", {})).rejects.toThrow("Seção desconhecida");
    await expect(salvarSecao("hero", [1, 2])).rejects.toThrow("objeto");
    await expect(salvarSecao("hero", { t: "x".repeat(100_001) })).rejects.toThrow("muito grande");
  });
});

describe("portfólio", () => {
  it("adiciona em ordem, edita, reordena e exclui", async () => {
    const base = { miniatura: "/uploads/portfolio/m.jpg", largura: 800, altura: 600, categoria: "ensaio" };
    const a = await adicionarFoto({ ...base, src: "/uploads/portfolio/a.jpg", alt: "A" });
    const b = await adicionarFoto({ ...base, src: "/uploads/portfolio/b.jpg", alt: "B" });
    expect((await listarPortfolio()).map((f) => f.alt)).toEqual(["A", "B"]);

    const editada = await editarFoto(a.id, { alt: "  A editada  ", categoria: "casamento", destaque: true });
    expect(editada).toMatchObject({ alt: "A editada", categoria: "casamento", destaque: true });

    await ordenarPortfolio([b.id, a.id]);
    expect((await listarPortfolio()).map((f) => f.alt)).toEqual(["B", "A editada"]);

    await excluirFoto(a.id);
    await expect(excluirFoto(a.id)).rejects.toThrow("não encontrada");
    expect(await listarPortfolio()).toHaveLength(1);
  });
});

describe("imagens enviadas", () => {
  const png1x1 = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  it("lê as dimensões de PNG e JPEG", () => {
    expect(dimensoes(png1x1)).toEqual({ largura: 1, altura: 1 });
    // JPEG mínimo: SOI + APP0 curto + SOF0 com 300 de altura × 200 de largura
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x00, 0xc8, 0x03]);
    expect(dimensoes(Buffer.concat([jpeg, Buffer.alloc(16)]))).toEqual({ largura: 200, altura: 300 });
  });

  it("recusa arquivo que diz ser imagem mas não é", async () => {
    const falso = new File([Buffer.from("<script>alert(1)</script>")], "x.png", { type: "image/png" });
    await expect(validarImagem(falso)).rejects.toThrow("não é uma imagem válida");
    const svg = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" });
    await expect(validarImagem(svg)).rejects.toThrow("Formato não suportado");
    const ok = new File([png1x1], "x.png", { type: "image/png" });
    await expect(validarImagem(ok)).resolves.toMatchObject({ extensao: "png" });
  });
});

describe("armazenamento local de imagens", () => {
  it("salva, lê pela URL /imagens e exclui", async () => {
    const os = await import("node:os");
    const fs = await import("node:fs");
    const path = await import("node:path");
    process.env.ARMAZENAMENTO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "imagens-"));
    const { chaveDaUrl, excluirImagem, lerImagem, salvarImagem } = await import("@/servidor/armazenamento");

    const url = await salvarImagem("portfolio", "0b6f1c3e-1d2a-4c5b-8e9f-123456789abc.png", Buffer.from("png"), "image/png");
    expect(url).toBe("/imagens/portfolio/0b6f1c3e-1d2a-4c5b-8e9f-123456789abc.png");
    const lida = await lerImagem(chaveDaUrl(url)!);
    expect(lida?.tipo).toBe("image/png");
    expect(Buffer.from(lida!.bytes as Buffer).toString()).toBe("png");

    await excluirImagem(url);
    expect(await lerImagem(chaveDaUrl(url)!)).toBeNull();
  });

  it("recusa chaves fora do padrão (path traversal)", async () => {
    const { chaveDaUrl, lerImagem } = await import("@/servidor/armazenamento");
    expect(chaveDaUrl("/imagens/../.env")).toBeNull();
    expect(chaveDaUrl("/imagens/portfolio/../../segredo.png")).toBeNull();
    expect(chaveDaUrl("/exemplos/foto.jpg")).toBeNull();
    expect(await lerImagem("../../package.json")).toBeNull();
  });
});
