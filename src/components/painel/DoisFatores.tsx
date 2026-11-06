"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { campo } from "./estilos";
import { CampoSenha } from "./CampoSenha";

type Status = { ativo: boolean; codigosRestantes: number };
type Configuracao = { segredo: string; uri: string; qrCode: string };
type Etapa =
  | { tipo: "inicio" }
  | { tipo: "senha" }
  | { tipo: "qr"; cfg: Configuracao }
  | { tipo: "codigos"; codigos: string[] }
  | { tipo: "desativar" }
  | { tipo: "novos" };

/** Verificação em duas etapas (TOTP) — configuração na página Conta. */
export function DoisFatores({ status }: { status: Status }) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "inicio" });
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function executar<T>(acao: () => Promise<T>, depois: (r: T) => void) {
    setErro("");
    setOcupado(true);
    try {
      depois(await acao());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setOcupado(false);
    }
  }

  const dadosDe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
  };

  const erroEl = erro && (
    <p role="alert" className="text-sm text-red-600">
      {erro}
    </p>
  );

  // ---- códigos de recuperação (mostrados uma única vez) ----
  if (etapa.tipo === "codigos") {
    const texto = `Códigos de recuperação do painel (cada um funciona uma vez):\n\n${etapa.codigos.join("\n")}\n`;
    return (
      <div className="mt-4 flex flex-col gap-4">
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <strong>Guarde estes códigos agora.</strong> Eles não serão mostrados de novo. Use um deles se perder o celular.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-xl bg-superficie p-4 font-mono text-sm">
          {etapa.codigos.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="botao-secundario" onClick={() => navigator.clipboard.writeText(texto)}>
            Copiar
          </button>
          <a className="botao-secundario" download="codigos-recuperacao.txt" href={`data:text/plain;charset=utf-8,${encodeURIComponent(texto)}`}>
            Baixar .txt
          </a>
          <button
            type="button"
            className="botao-primario"
            onClick={() => {
              setEtapa({ tipo: "inicio" });
              router.refresh();
            }}
          >
            Já guardei os códigos
          </button>
        </div>
      </div>
    );
  }

  // ---- ativo ----
  if (status.ativo) {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <p className="flex items-center gap-2 text-sm">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
          <span>
            <strong>Ativada.</strong> O login pede o código do app autenticador. Códigos de recuperação restantes:{" "}
            <strong>{status.codigosRestantes}</strong>.
          </span>
        </p>
        {status.codigosRestantes <= 3 && etapa.tipo === "inicio" && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Restam poucos códigos de recuperação. Gere novos.</p>
        )}

        {etapa.tipo === "novos" && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              const d = dadosDe(e);
              executar(
                () => api<{ codigosRecuperacao: string[] }>("/api/painel/2fa/codigos", { method: "POST", json: d }),
                (r) => setEtapa({ tipo: "codigos", codigos: r.codigosRecuperacao }),
              );
            }}
          >
            <input name="codigo" required inputMode="numeric" autoComplete="one-time-code" placeholder="Código do app (6 dígitos)" className={campo} />
            {erroEl}
            <div className="flex gap-2">
              <button className="botao-primario" disabled={ocupado}>
                Gerar novos códigos
              </button>
              <button type="button" className="botao-secundario" onClick={() => setEtapa({ tipo: "inicio" })}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {etapa.tipo === "desativar" && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              const d = dadosDe(e);
              executar(
                () => api("/api/painel/2fa/desativar", { method: "POST", json: d }),
                () => {
                  setEtapa({ tipo: "inicio" });
                  router.refresh();
                },
              );
            }}
          >
            <p className="text-sm text-texto-suave">Sem a verificação em duas etapas, só a senha protege o painel.</p>
            <CampoSenha name="senha" required autoComplete="current-password" placeholder="Senha atual" />
            <input name="codigo" required autoComplete="one-time-code" placeholder="Código do app ou de recuperação" className={campo} />
            {erroEl}
            <div className="flex gap-2">
              <button className="botao bg-red-600 text-white hover:bg-red-700" disabled={ocupado}>
                Desativar
              </button>
              <button type="button" className="botao-secundario" onClick={() => setEtapa({ tipo: "inicio" })}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {etapa.tipo === "inicio" && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="botao-secundario" onClick={() => setEtapa({ tipo: "novos" })}>
              Gerar novos códigos de recuperação
            </button>
            <button type="button" className="botao-secundario text-red-600" onClick={() => setEtapa({ tipo: "desativar" })}>
              Desativar
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- desativado: configuração ----
  if (etapa.tipo === "qr") {
    return (
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          const d = dadosDe(e);
          executar(
            () => api<{ codigosRecuperacao: string[] }>("/api/painel/2fa/ativar", { method: "POST", json: d }),
            (r) => setEtapa({ tipo: "codigos", codigos: r.codigosRecuperacao }),
          );
        }}
      >
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
          <li>
            Instale um app autenticador no celular (Google Authenticator, Microsoft Authenticator ou Authy).
          </li>
          <li>No app, toque em &ldquo;+&rdquo; e escaneie o QR Code abaixo.</li>
          <li>Digite o código de 6 dígitos que aparecer no app.</li>
        </ol>
        <div className="flex flex-col items-center gap-3 rounded-xl bg-superficie p-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado pelo servidor (data URI) */}
          <img src={etapa.cfg.qrCode} alt="QR Code para o app autenticador" width={200} height={200} className="rounded-lg bg-white" />
          <div className="text-sm">
            <p className="text-texto-suave">Não consegue escanear? Digite esta chave no app:</p>
            <p className="mt-1 break-all font-mono text-base font-medium">{etapa.cfg.segredo}</p>
            <a href={etapa.cfg.uri} className="mt-2 inline-block text-destaque underline sm:hidden">
              Abrir no app autenticador deste celular
            </a>
          </div>
        </div>
        <input
          name="codigo"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="000000"
          aria-label="Código de 6 dígitos"
          className={`${campo} text-center font-mono text-2xl tracking-[0.5em]`}
        />
        {erroEl}
        <div className="flex gap-2">
          <button className="botao-primario" disabled={ocupado}>
            {ocupado ? "Verificando..." : "Ativar"}
          </button>
          <button type="button" className="botao-secundario" onClick={() => setEtapa({ tipo: "inicio" })}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  if (etapa.tipo === "senha") {
    return (
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => {
          const d = dadosDe(e);
          executar(
            () => api<Configuracao>("/api/painel/2fa/configurar", { method: "POST", json: d }),
            (cfg) => setEtapa({ tipo: "qr", cfg }),
          );
        }}
      >
        <p className="text-sm text-texto-suave">Para começar, confirme sua senha.</p>
        <CampoSenha name="senha" required autoComplete="current-password" placeholder="Senha atual" autoFocus />
        {erroEl}
        <div className="flex gap-2">
          <button className="botao-primario" disabled={ocupado}>
            Continuar
          </button>
          <button type="button" className="botao-secundario" onClick={() => setEtapa({ tipo: "inicio" })}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-sm text-texto-suave">
        Além da senha, o login passa a pedir um código de 6 dígitos gerado no seu celular. Mesmo que alguém descubra sua senha,
        não consegue entrar no painel.
      </p>
      <button type="button" className="botao-primario self-start" onClick={() => setEtapa({ tipo: "senha" })}>
        Ativar verificação em duas etapas
      </button>
    </div>
  );
}
