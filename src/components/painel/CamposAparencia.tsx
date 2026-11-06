"use client";

import { useState } from "react";
import { enviarArquivo } from "@/lib/api";
import { LADO_LOGO, redimensionar } from "@/lib/redimensionar";
import { FONTES, varFonte } from "@/lib/fontes-lista";
import { removerFundoBranco } from "@/lib/imagem";
import { IconeUpload } from "../Icones";
import { CORES_NOME_PADRAO, corDaParte, Marca } from "../Marca";
import { campo } from "./estilos";

const LOGO_ORIGINAL = "/marca/icone.png";

/** Envio da logo (PNG transparente), com remoção opcional do fundo branco. */
export function CampoLogo({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  const [semFundo, setSemFundo] = useState(true);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  return (
    <fieldset className="rounded-sm border border-borda p-3">
      <legend className="px-1 text-sm font-medium">Logo</legend>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Prévia em fundo claro e escuro para conferir a transparência */}
        <div className="flex gap-2">
          {["bg-fundo", "bg-escuro"].map((fundo) => (
            <div key={fundo} className={`flex size-24 items-center justify-center rounded-sm border border-borda ${fundo}`}>
              {valor ? (
                // eslint-disable-next-line @next/next/no-img-element -- prévia
                <img src={valor} alt="" className="max-h-20 max-w-20" />
              ) : (
                <span className="text-xs text-texto-suave">sem logo</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <label className="botao-secundario min-h-10 cursor-pointer px-4">
            <IconeUpload className="size-4" />
            {progresso !== null ? `Enviando ${Math.round(progresso * 100)}%` : "Enviar nova logo"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={async (e) => {
                const arquivo = e.target.files?.[0];
                e.target.value = "";
                if (!arquivo) return;
                setErro("");
                setProgresso(0);
                try {
                  const reduzida = await redimensionar(arquivo, LADO_LOGO);
                  const conteudo = semFundo ? new File([await removerFundoBranco(reduzida)], "logo.png", { type: "image/png" }) : reduzida;
                  const r = await enviarArquivo<{ src: string }>("/api/painel/imagens/logo", { arquivo: conteudo }, setProgresso);
                  aoMudar(r.src);
                } catch (err) {
                  setErro(err instanceof Error ? err.message : "Falhou.");
                } finally {
                  setProgresso(null);
                }
              }}
            />
          </label>
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input type="checkbox" checked={semFundo} onChange={(e) => setSemFundo(e.target.checked)} className="size-4 accent-destaque" />
            Remover fundo branco automaticamente
          </label>
          <div className="flex gap-3 text-xs">
            {valor !== LOGO_ORIGINAL && (
              <button type="button" onClick={() => aoMudar(LOGO_ORIGINAL)} className="text-destaque underline">
                Usar logo original
              </button>
            )}
            {valor && (
              <button type="button" onClick={() => aoMudar("")} className="text-texto-suave underline">
                Sem logo (só o nome)
              </button>
            )}
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <p className="text-xs text-texto-suave">PNG ou JPG. A logo também vira o ícone da aba do navegador.</p>
        </div>
      </div>
    </fieldset>
  );
}

/** Nome ao lado da logo: texto, uma cor por parte e prévia em fundo claro e escuro. */
export function CampoNomeLogo({
  valor,
  cores,
  aoMudar,
  aoMudarCores,
}: {
  valor: string;
  cores: string[];
  aoMudar: (v: string) => void;
  aoMudarCores: (v: string[]) => void;
}) {
  const partes = valor.split("|").filter((p) => p.length > 0);
  const qtd = Math.max(1, partes.length);
  const corAtual = (i: number) => corDaParte(cores, i, false);
  const definirCor = (i: number, cor: string) => {
    const nova = Array.from({ length: Math.max(qtd, cores.length) }, (_, j) => corAtual(j));
    nova[i] = cor;
    aoMudarCores(nova);
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nome ao lado da logo
        <input value={valor} onChange={(e) => aoMudar(e.target.value)} maxLength={40} className={campo} />
        <span className="text-xs font-normal text-texto-suave">
          Use <code className="rounded bg-superficie px-1">|</code> para separar partes com cores diferentes. Ex.:{" "}
          <code className="rounded bg-superficie px-1">DAVI|FOTO|VIDEO</code>. Deixe vazio para mostrar só a logo.
        </span>
      </label>

      {valor.trim() && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Cor do nome</span>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: qtd }, (_, i) => (
              <label key={i} className="flex min-h-11 items-center gap-2 rounded-2xl border border-borda bg-white px-2 text-sm">
                <input
                  type="color"
                  value={corAtual(i)}
                  onChange={(e) => definirCor(i, e.target.value)}
                  className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label={`Cor de ${partes[i] ?? valor}`}
                />
                <span className="font-marca text-lg tracking-wide" style={{ color: corAtual(i) }}>
                  {partes[i] ?? valor}
                </span>
                <input
                  value={corAtual(i)}
                  onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && definirCor(i, e.target.value)}
                  maxLength={7}
                  className="w-20 rounded-sm border border-borda px-1 py-0.5 font-mono text-xs uppercase"
                  aria-label="Código da cor"
                />
              </label>
            ))}
          </div>
          <button type="button" onClick={() => aoMudarCores(CORES_NOME_PADRAO)} className="self-start text-xs text-destaque underline">
            Usar cores originais da logo
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 rounded-sm bg-superficie p-3">
        <Marca nome={valor || " "} cores={cores} className="text-3xl" />
        <span className="rounded-sm bg-escuro px-3 py-2">
          <Marca nome={valor || " "} cores={cores} claro className="text-3xl" />
        </span>
        <span className="text-xs text-texto-suave">No fundo escuro (rodapé), cores muito escuras aparecem em branco.</span>
      </div>
    </fieldset>
  );
}

const GRUPOS_FONTE = [
  { nome: "Com serifa", fontes: FONTES.filter((f) => !f.estilo.startsWith("Sem serifa")) },
  { nome: "Sem serifa", fontes: FONTES.filter((f) => f.estilo.startsWith("Sem serifa")) },
];

/** Escolha entre as 10 fontes numa lista de seleção, com prévia da escolhida. */
export function SeletorFonte({
  rotulo,
  valor,
  titulos,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  titulos: boolean;
  aoMudar: (v: string) => void;
}) {
  const atual = FONTES.find((f) => f.slug === valor);
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm font-medium">
        {rotulo}
        <select value={atual?.slug ?? ""} onChange={(e) => aoMudar(e.target.value)} className={campo}>
          {!atual && <option value="">Escolha uma fonte</option>}
          {GRUPOS_FONTE.map((g) => (
            <optgroup key={g.nome} label={g.nome}>
              {g.fontes.map((f) => (
                // no computador, cada opção já aparece na própria fonte
                <option key={f.slug} value={f.slug} style={{ fontFamily: varFonte(f.slug) }}>
                  {f.nome} · {f.estilo}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {atual && (
        <p
          className="rounded-sm border border-borda bg-white px-3 py-2"
          style={{ fontFamily: varFonte(atual.slug), fontSize: titulos ? "1.6rem" : "1rem", lineHeight: 1.3 }}
          aria-label={`Prévia da fonte ${atual.nome}`}
        >
          {titulos ? "Registrando momentos" : "Fotografia autoral para eternizar os momentos que importam."}
        </p>
      )}
    </div>
  );
}
