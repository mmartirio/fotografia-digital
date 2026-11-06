import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPainel } from "@/components/painel/LoginPainel";
import { Marca } from "@/components/Marca";
import { obterConteudo } from "@/conteudo/obter";
import { usuarioAtual } from "@/servidor/http";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default async function EntrarPainel() {
  if (await usuarioAtual()) redirect("/painel");
  const { aparencia } = await obterConteudo();
  return (
    <main className="fonte-painel flex min-h-dvh items-center justify-center bg-superficie px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo do painel */}
          {aparencia.logo && <img src={aparencia.logo} alt="" className="h-14 w-auto" />}
          <Marca nome={aparencia.nomeLogo} cores={aparencia.coresNome} className="text-4xl" />
          <p className="text-sm text-texto-suave">Painel gestor</p>
        </div>
        <LoginPainel />
      </div>
    </main>
  );
}
