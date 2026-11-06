import type { Metadata } from "next";
import { BotaoSair } from "@/components/BotaoSair";
import { TrocarSenha } from "@/components/painel/TrocarSenha";
import { cartao } from "@/components/painel/estilos";
import { apiServidor } from "@/lib/api-servidor";

export const metadata: Metadata = { title: "Conta" };

export default async function Conta() {
  const { dados } = await apiServidor<{ nome: string; email: string }>("/api/painel/eu");
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-3xl">Conta</h1>
      <section className={cartao}>
        <p className="font-medium">{dados?.nome}</p>
        <p className="text-sm text-texto-suave">{dados?.email}</p>
        <BotaoSair rota="/api/publico/acesso/painel/sair" destino="/painel/entrar" className="mt-4" />
      </section>
      <section className={cartao}>
        <h2 className="text-xl">Trocar senha</h2>
        <TrocarSenha />
      </section>
    </div>
  );
}
