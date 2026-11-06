import type { Metadata } from "next";
import { BotaoSair } from "@/components/BotaoSair";
import { DoisFatores } from "@/components/painel/DoisFatores";
import { TrocarSenha } from "@/components/painel/TrocarSenha";
import { cartao } from "@/components/painel/estilos";
import { apiServidor } from "@/lib/api-servidor";

export const metadata: Metadata = { title: "Conta" };

export default async function Conta() {
  const [{ dados }, { dados: doisFatores }] = await Promise.all([
    apiServidor<{ nome: string; email: string }>("/api/painel/eu"),
    apiServidor<{ ativo: boolean; codigosRestantes: number }>("/api/painel/2fa"),
  ]);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-3xl">Conta</h1>
      <section className={cartao}>
        <p className="font-medium">{dados?.nome}</p>
        <p className="text-sm text-texto-suave">{dados?.email}</p>
        <BotaoSair rota="/api/publico/acesso/painel/sair" destino="/painel/entrar" className="mt-4" />
      </section>
      <section id="dois-fatores" className={`${cartao} scroll-mt-24`}>
        <h2 className="text-xl">Verificação em duas etapas</h2>
        <DoisFatores status={doisFatores ?? { ativo: false, codigosRestantes: 0 }} />
      </section>
      <section className={cartao}>
        <h2 className="text-xl">Trocar senha</h2>
        <TrocarSenha />
      </section>
    </div>
  );
}
