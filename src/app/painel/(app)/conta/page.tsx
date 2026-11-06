import type { Metadata } from "next";
import { BotaoSair } from "@/components/BotaoSair";
import { DoisFatores } from "@/components/painel/DoisFatores";
import { TrocarSenha } from "@/components/painel/TrocarSenha";
import { cartao } from "@/components/painel/estilos";
import { redirect } from "next/navigation";
import { statusDoisFatores } from "@/servidor/acesso";
import { usuarioAtual } from "@/servidor/http";

export const metadata: Metadata = { title: "Conta" };

export default async function Conta() {
  const u = await usuarioAtual();
  if (!u) redirect("/painel/entrar");
  const doisFatores = await statusDoisFatores(u);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-3xl">Conta</h1>
      <section className={cartao}>
        <p className="font-medium">{u.nome}</p>
        <p className="text-sm text-texto-suave">{u.email}</p>
        <BotaoSair rota="/api/publico/acesso/painel/sair" destino="/painel/entrar" className="mt-4" />
      </section>
      <section id="dois-fatores" className={`${cartao} scroll-mt-24`}>
        <h2 className="text-xl">Verificação em duas etapas</h2>
        <DoisFatores status={doisFatores} />
      </section>
      <section className={cartao}>
        <h2 className="text-xl">Trocar senha</h2>
        <TrocarSenha />
      </section>
    </div>
  );
}
