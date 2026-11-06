import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MenuPainel } from "@/components/painel/MenuPainel";
import { obterConteudo } from "@/conteudo/obter";
import { usuarioAtual } from "@/servidor/http";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel" },
  robots: { index: false, follow: false },
};

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const u = await usuarioAtual();
  if (!u) redirect("/painel/entrar");
  const { aparencia } = await obterConteudo();

  return (
    <div className="fonte-painel min-h-dvh bg-superficie lg:flex">
      <MenuPainel nome={u.nome} aparencia={aparencia} />
      <main className="min-w-0 flex-1 px-4 pb-24 pt-20 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        {/* Lembrete até a verificação em duas etapas ser ativada */}
        {!u.totp_ativo && (
          <div className="mx-auto mb-6 flex max-w-6xl flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <strong>Proteja o painel:</strong> ative a verificação em duas etapas. Assim, mesmo com a senha, ninguém entra sem o
              código do seu celular.
            </p>
            <Link href="/painel/conta#dois-fatores" className="botao-primario min-h-10 shrink-0 px-5">
              Ativar agora
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
