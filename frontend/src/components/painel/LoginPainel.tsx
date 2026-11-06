"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { campo } from "./estilos";

export function LoginPainel() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(e.currentTarget));
    setEnviando(true);
    setErro("");
    try {
      await api("/api/publico/acesso/painel/entrar", { method: "POST", json: dados });
      router.replace("/painel");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="flex flex-col gap-4 rounded-sm border border-borda bg-white p-6 shadow-sm">
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
