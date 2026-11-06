"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotaoSair } from "../BotaoSair";
import { LogoMarca } from "../Marca";
import type { ConteudoSite } from "@/conteudo/tipos";

const ITENS = [
  { href: "/painel", rotulo: "Início", icone: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/painel/portfolio", rotulo: "Portfólio", icone: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" },
  { href: "/painel/site", rotulo: "Editar site", icone: "M4 6h16M4 12h10M4 18h13" },
  { href: "/painel/conta", rotulo: "Conta", icone: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
];

function Icone({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** Desktop: barra lateral. Mobile: topo com marca + barra inferior com os atalhos principais. */
export function MenuPainel({ nome, aparencia }: { nome: string; aparencia: ConteudoSite["aparencia"] }) {
  const caminho = usePathname();
  const ativo = (href: string) => (href === "/painel" ? caminho === "/painel" : caminho.startsWith(href));

  return (
    <>
      {/* Topo (mobile) */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-borda bg-fundo/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/painel">
          <LogoMarca aparencia={aparencia} tamanhoIcone="h-7" tamanhoNome="text-xl" />
        </Link>
        <a href="/" target="_blank" className="text-sm text-destaque">
          Ver site ↗
        </a>
      </header>

      {/* Lateral (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-borda bg-white p-5 lg:flex">
        <Link href="/painel">
          <LogoMarca aparencia={aparencia} tamanhoIcone="h-9" tamanhoNome="text-2xl" />
        </Link>
        <p className="mt-1 text-xs text-texto-suave">Painel gestor</p>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Painel">
          {ITENS.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-all active:scale-[0.97] ${
                ativo(i.href) ? "bg-destaque text-white" : "text-texto hover:bg-superficie"
              }`}
            >
              <Icone d={i.icone} /> {i.rotulo}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-borda pt-4">
          <a href="/" target="_blank" className="text-sm text-destaque hover:underline">
            Ver site ↗
          </a>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-texto-suave">{nome}</span>
            <BotaoSair rota="/api/publico/acesso/painel/sair" destino="/painel/entrar" />
          </div>
        </div>
      </aside>

      {/* Barra inferior (mobile) */}
      <nav
        aria-label="Painel"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-borda bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {ITENS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] transition-transform active:scale-90 ${ativo(i.href) ? "text-destaque" : "text-texto-suave"}`}
          >
            <Icone d={i.icone} />
            {i.rotulo.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </>
  );
}
