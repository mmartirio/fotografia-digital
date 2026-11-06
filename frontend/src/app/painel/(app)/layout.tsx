import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MenuPainel } from "@/components/painel/MenuPainel";
import { obterConteudo } from "@/conteudo/obter";
import { apiServidor } from "@/lib/api-servidor";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel" },
  robots: { index: false, follow: false },
};

type Eu = { nome: string; email: string };

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const { status, dados } = await apiServidor<Eu>("/api/painel/eu");
  if (status !== 200 || !dados) redirect("/painel/entrar");
  const { aparencia } = await obterConteudo();

  return (
    <div className="min-h-dvh bg-superficie lg:flex">
      <MenuPainel nome={dados.nome} aparencia={aparencia} />
      <main className="min-w-0 flex-1 px-4 pb-24 pt-20 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
    </div>
  );
}
