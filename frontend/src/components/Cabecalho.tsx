"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { IconeFechar, IconeMenu } from "./Icones";
import { LogoMarca } from "./Marca";
import type { ConteudoSite } from "@/conteudo/tipos";

// Menu fixo (não editável pelo painel, por requisito), na mesma ordem das seções na página
const LINKS = [
  { href: "#inicio", texto: "Início" },
  { href: "#portfolio", texto: "Portfólio" },
  { href: "#sobre", texto: "Sobre" },
  { href: "#servicos", texto: "Serviços" },
  { href: "#depoimentos", texto: "Depoimentos" },
  { href: "#faq", texto: "Dúvidas" },
  { href: "#orcamento", texto: "Contato" },
];

export function Cabecalho({ marca, aparencia }: { marca: string; aparencia: ConteudoSite["aparencia"] }) {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 40);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // Trava a rolagem do fundo com o menu mobile aberto
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <>
    {/* Fundo translúcido com desfoque (efeito vidro): a foto aparece por trás sem perder a leitura */}
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-white/40 bg-fundo/70 text-texto backdrop-blur-md backdrop-saturate-150 transition-shadow duration-300 ${
        rolou ? "shadow-md shadow-black/5" : ""
      }`}
    >
      <nav className="container-site flex h-16 items-center justify-between lg:h-20" aria-label="Principal">
        <Link href="#inicio" aria-label={marca} onClick={() => setAberto(false)}>
          <LogoMarca aparencia={aparencia} />
        </Link>

        {/* Desktop */}
        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-sm text-texto/80 transition-colors hover:text-destaque">
                {l.texto}
              </a>
            </li>
          ))}
          <li>
            <Link href="/cliente" className="botao-secundario min-h-10 px-5">
              Área do cliente
            </Link>
          </li>
        </ul>

        {/* Mobile */}
        <button
          type="button"
          className="-mr-2 inline-flex size-11 items-center justify-center lg:hidden"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
          aria-controls="menu-mobile"
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? <IconeFechar /> : <IconeMenu />}
        </button>
      </nav>
    </header>

      {/* Fora do header: backdrop-filter criaria um containing block para o fixed */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            id="menu-mobile"
            className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-fundo lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="container-site flex flex-col pt-4">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <a
                    href={l.href}
                    className="flex min-h-12 items-center border-b border-black/5 py-3 text-lg text-texto/90 transition-colors active:text-destaque"
                    onClick={() => setAberto(false)}
                  >
                    {l.texto}
                  </a>
                </motion.li>
              ))}
              <li className="pt-6">
                <Link href="/cliente" className="botao-primario w-full" onClick={() => setAberto(false)}>
                  Área do cliente
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
