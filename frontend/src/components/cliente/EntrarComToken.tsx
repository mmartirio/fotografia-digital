"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

/** Troca o token do link mágico por uma sessão e leva o cliente às galerias. */
export function EntrarComToken() {
  const params = useSearchParams();
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const enviado = useRef(false); // evita uso duplo do token (StrictMode monta 2x em dev)

  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;
    const token = params.get("token");
    if (!token) {
      setErro("Link de acesso inválido.");
      return;
    }
    api("/api/publico/acesso/cliente/entrar", { method: "POST", json: { token } })
      .then(() => {
        router.replace("/cliente/galerias");
        router.refresh();
      })
      .catch((e: Error) => setErro(e.message));
  }, [params, router]);

  return (
    <div className="w-full max-w-md rounded-xl border border-borda bg-white p-8 text-center shadow-sm">
      {erro ? (
        <>
          <h1 className="text-2xl">Não foi possível entrar</h1>
          <p className="mt-3 text-sm text-texto-suave">{erro}</p>
          <Link href="/cliente" className="botao-primario mt-6">
            Pedir novo link
          </Link>
        </>
      ) : (
        <>
          <div className="mx-auto size-10 animate-spin rounded-full border-2 border-borda border-t-destaque" />
          <p className="mt-4 text-texto-suave">Abrindo sua galeria...</p>
        </>
      )}
    </div>
  );
}
