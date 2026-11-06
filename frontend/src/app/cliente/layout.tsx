import type { Metadata } from "next";
import Link from "next/link";
import { BotaoSair } from "@/components/BotaoSair";
import { LogoMarca } from "@/components/Marca";
import { obterConteudo } from "@/conteudo/obter";
import { apiServidor } from "@/lib/api-servidor";
import type { ClienteDto } from "@/lib/galeria";

export const metadata: Metadata = {
  title: "Área do cliente",
  robots: { index: false, follow: false },
};

export default async function LayoutCliente({ children }: { children: React.ReactNode }) {
  const [{ dados: cliente }, { aparencia, marca }] = await Promise.all([apiServidor<ClienteDto>("/api/cliente/eu"), obterConteudo()]);
  return (
    <div className="flex min-h-dvh flex-col bg-superficie">
      <header className="sticky top-0 z-30 border-b border-borda bg-fundo/80 backdrop-blur-md">
        <div className="container-site flex h-16 items-center justify-between gap-4">
          <Link href={cliente ? "/cliente/galerias" : "/"} aria-label={marca}>
            <LogoMarca aparencia={aparencia} tamanhoIcone="h-8" tamanhoNome="text-2xl" />
          </Link>
          {cliente && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-texto-suave sm:inline">Olá, {cliente.nome.split(" ")[0]}</span>
              <BotaoSair rota="/api/publico/acesso/cliente/sair" destino="/cliente" />
            </div>
          )}
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
