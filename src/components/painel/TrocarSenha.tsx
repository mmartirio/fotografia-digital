"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { campo } from "./estilos";

export function TrocarSenha() {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function trocar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (d.novaSenha !== d.confirmacao) {
      setMsg({ ok: false, texto: "A confirmação não confere." });
      return;
    }
    try {
      await api("/api/painel/senha", { method: "POST", json: { senhaAtual: d.senhaAtual, novaSenha: d.novaSenha } });
      setMsg({ ok: true, texto: "Senha alterada!" });
      form.reset();
    } catch (err) {
      setMsg({ ok: false, texto: err instanceof Error ? err.message : "Falhou." });
    }
  }

  return (
    <form onSubmit={trocar} className="mt-4 flex flex-col gap-3">
      <input name="senhaAtual" type="password" required placeholder="Senha atual" autoComplete="current-password" className={campo} />
      <input name="novaSenha" type="password" required minLength={8} placeholder="Nova senha (mín. 8 caracteres)" autoComplete="new-password" className={campo} />
      <input name="confirmacao" type="password" required minLength={8} placeholder="Confirme a nova senha" autoComplete="new-password" className={campo} />
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.texto}</p>}
      <button type="submit" className="botao-primario self-start">
        Salvar nova senha
      </button>
    </form>
  );
}
