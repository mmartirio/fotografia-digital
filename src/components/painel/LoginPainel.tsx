"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { campo } from "./estilos";

type RespostaLogin = { status: "ok" } | { status: "2fa"; desafio: string };

/** Login do painel: e-mail + senha e, se ativada, a verificação em duas etapas. */
export function LoginPainel() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [desafio, setDesafio] = useState<string | null>(null);
  const [recuperacao, setRecuperacao] = useState(false);
  const [codigo, setCodigo] = useState("");

  function entrarNoPainel() {
    router.replace("/painel");
    router.refresh();
  }

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(e.currentTarget));
    setEnviando(true);
    setErro("");
    try {
      const r = await api<RespostaLogin>("/api/publico/acesso/painel/entrar", { method: "POST", json: dados });
      if (r.status === "2fa") {
        setDesafio(r.desafio);
        setEnviando(false);
      } else {
        entrarNoPainel();
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  }

  async function confirmar(valor: string) {
    if (!desafio || enviando) return;
    setEnviando(true);
    setErro("");
    const resp = await fetch("/api/publico/acesso/painel/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desafio, codigo: valor }),
    }).catch(() => null);
    if (resp?.ok) return entrarNoPainel();
    const corpo = resp ? await resp.json().catch(() => ({})) : {};
    setErro(corpo.erro ?? "Não foi possível verificar o código.");
    setCodigo("");
    setEnviando(false);
    // desafio expirou ou foi encerrado (muitas tentativas): volta para e-mail e senha
    if (corpo.reiniciar === "true" || resp?.status === 429) setDesafio(null);
  }

  if (desafio) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          confirmar(codigo);
        }}
        className="flex flex-col gap-4 rounded-2xl border border-borda bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-xl">Verificação em duas etapas</h2>
          <p className="mt-1 text-sm text-texto-suave">
            {recuperacao
              ? "Digite um dos seus códigos de recuperação (cada um funciona uma única vez)."
              : "Abra o app autenticador no celular e digite o código de 6 dígitos."}
          </p>
        </div>
        {recuperacao ? (
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            autoFocus
            required
            maxLength={11}
            autoComplete="off"
            placeholder="XXXXX-XXXXX"
            aria-label="Código de recuperação"
            className={`${campo} text-center font-mono text-lg tracking-widest`}
          />
        ) : (
          <input
            value={codigo}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCodigo(v);
              if (v.length === 6) confirmar(v); // envia sozinho ao completar
            }}
            autoFocus
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            placeholder="000000"
            aria-label="Código de 6 dígitos"
            className={`${campo} text-center font-mono text-2xl tracking-[0.5em]`}
          />
        )}
        {erro && (
          <p role="alert" className="text-sm text-red-600">
            {erro}
          </p>
        )}
        <button type="submit" disabled={enviando || codigo.length < 6} className="botao-primario disabled:opacity-60">
          {enviando ? "Verificando..." : "Confirmar"}
        </button>
        <div className="flex justify-between text-sm">
          <button
            type="button"
            className="text-destaque underline"
            onClick={() => {
              setRecuperacao((v) => !v);
              setCodigo("");
              setErro("");
            }}
          >
            {recuperacao ? "Usar o app autenticador" : "Perdi o celular: usar código de recuperação"}
          </button>
          <button type="button" className="text-texto-suave underline" onClick={() => setDesafio(null)}>
            Voltar
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={entrar} className="flex flex-col gap-4 rounded-2xl border border-borda bg-white p-6 shadow-sm">
      <label className="flex flex-col gap-2 text-sm font-medium">
        E-mail
        <input name="email" type="email" required autoComplete="username" className={campo} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Senha
        <input name="senha" type="password" required autoComplete="current-password" className={campo} />
      </label>
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
      <button type="submit" disabled={enviando} className="botao-primario disabled:opacity-60">
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
