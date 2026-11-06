"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { IconeEmail } from "../Icones";

type Resposta = { mensagem: string; linkDev?: string };

export function FormularioAcesso() {
  const [estado, setEstado] = useState<"inicial" | "enviando" | "enviado" | "erro">("inicial");
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [erro, setErro] = useState("");

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setEstado("enviando");
    try {
      setResposta(await api<Resposta>("/api/publico/acesso/cliente/link", { method: "POST", json: { email } }));
      setEstado("enviado");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar agora.");
      setEstado("erro");
    }
  }

  if (estado === "enviado" && resposta) {
    return (
      <div className="mt-6 rounded-xl bg-agua/40 p-5 text-sm">
        <IconeEmail className="mb-2 size-7 text-destaque" />
        <p className="font-medium text-grafite">Verifique seu e-mail</p>
        <p className="mt-1 text-texto-suave">{resposta.mensagem} O link vale por 30 minutos.</p>
        {resposta.linkDev && (
          <div className="mt-4 rounded-xl border border-dashed border-destaque/50 bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-destaque">Modo demonstração</p>
            <p className="mt-1 text-xs text-texto-suave">Sem servidor de e-mail configurado. Use o link abaixo:</p>
            <a href={resposta.linkDev} className="botao-primario mt-3 w-full">
              Abrir link de acesso
            </a>
          </div>
        )}
        <button type="button" className="mt-4 text-sm text-destaque underline" onClick={() => setEstado("inicial")}>
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-6 flex flex-col gap-3">
      <label className="flex flex-col gap-2 text-sm font-medium">
        E-mail
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          className="min-h-12 rounded-xl border border-borda bg-white px-4 text-base font-normal focus:border-destaque focus:outline-none"
        />
      </label>
      {estado === "erro" && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
      <button type="submit" disabled={estado === "enviando"} className="botao-primario disabled:opacity-60">
        {estado === "enviando" ? "Enviando..." : "Receber link de acesso"}
      </button>
    </form>
  );
}
