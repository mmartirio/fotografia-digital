"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IconeLixeira, IconeSeta } from "../Icones";
import { campo } from "./estilos";
import { Uploader } from "./Uploader";

export type FotoPortfolioApi = {
  id: string;
  src: string;
  miniatura: string;
  largura: number;
  altura: number;
  alt: string;
  categoria: string;
  destaque: boolean;
  ordem: number;
};

export function PortfolioPainel({ fotos: iniciais, categorias }: { fotos: FotoPortfolioApi[]; categorias: { slug: string; nome: string }[] }) {
  const router = useRouter();
  const [fotos, setFotos] = useState(iniciais);
  const [categoriaEnvio, setCategoriaEnvio] = useState(categorias[0]?.slug ?? "");
  const [erro, setErro] = useState("");
  useEffect(() => setFotos(iniciais), [iniciais]);

  async function editar(f: FotoPortfolioApi, mudanca: Partial<FotoPortfolioApi>) {
    const nova = { ...f, ...mudanca };
    setFotos((fs) => fs.map((x) => (x.id === f.id ? nova : x)));
    try {
      await api(`/api/painel/portfolio/${f.id}`, { method: "PUT", json: { categoria: nova.categoria, alt: nova.alt, destaque: nova.destaque } });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falhou.");
    }
  }

  async function mover(indice: number, passo: number) {
    const destino = indice + passo;
    if (destino < 0 || destino >= fotos.length) return;
    const nova = [...fotos];
    [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
    setFotos(nova);
    await api("/api/painel/portfolio/ordem", { method: "PUT", json: { ids: nova.map((f) => f.id) } })
      .catch(() => setErro("Não foi possível reordenar."));
  }

  async function excluir(f: FotoPortfolioApi) {
    if (!window.confirm("Excluir esta foto do portfólio?")) return;
    setFotos((fs) => fs.filter((x) => x.id !== f.id));
    await api(`/api/painel/portfolio/${f.id}`, { method: "DELETE" })
      .catch(() => router.refresh());
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl">Portfólio</h1>
      <p className="mt-1 text-sm text-texto-suave">
        Fotos exibidas na seção Portfólio do site. Enquanto você não enviar nenhuma, o site mostra as fotos de exemplo.
      </p>

      {/* Como gerenciar as categorias (filtros do portfólio no site) */}
      <details className="group mt-5 rounded-2xl border border-borda bg-white open:shadow-sm">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span>
            Categorias: <span className="font-normal text-texto-suave">{categorias.map((c) => c.nome).join(" · ") || "nenhuma"}</span>
          </span>
          <span className="shrink-0 text-destaque group-open:hidden">Como criar ou editar?</span>
          <span className="hidden shrink-0 text-texto-suave group-open:inline">Fechar</span>
        </summary>
        <div className="border-t border-borda px-4 pb-4 pt-3 text-sm leading-relaxed">
          <p className="text-texto-suave">As categorias viram os filtros do portfólio no site (ex.: Casamentos, Ensaios) e aparecem na mesma ordem.</p>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
            <li>
              Abra <strong>Editar site → Portfólio</strong> (botão abaixo) e desça até <strong>Categorias</strong>.
            </li>
            <li>
              <strong>Criar:</strong> clique em <strong>+ Adicionar</strong> e preencha o <strong>Nome</strong> (como aparece no site, ex.:
              &ldquo;Aniversários&rdquo;) e o <strong>Identificador</strong> (uma palavra, sem espaços nem acentos, ex.:
              &ldquo;aniversarios&rdquo;).
            </li>
            <li>
              <strong>Renomear:</strong> altere só o <strong>Nome</strong>. Não mude o Identificador, senão as fotos perdem a categoria.
            </li>
            <li>
              <strong>Mudar a ordem:</strong> use as setas de cada item. <strong>Excluir:</strong> antes, mude as fotos dessa categoria para
              outra aqui embaixo.
            </li>
            <li>
              Clique em <strong>Salvar alterações</strong>. Depois, volte aqui para escolher a categoria ao enviar fotos.
            </li>
          </ol>
          <Link href="/painel/site?secao=portfolio" className="botao-primario mt-4 min-h-11 px-5">
            Gerenciar categorias
          </Link>
        </div>
      </details>

      <div className="mt-5 grid gap-3 sm:grid-cols-[200px_1fr] sm:items-start">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Categoria das novas fotos
          <select value={categoriaEnvio} onChange={(e) => setCategoriaEnvio(e.target.value)} className={campo}>
            {categorias.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <Uploader<FotoPortfolioApi>
          rota="/api/painel/portfolio"
          campos={{ categoria: categoriaEnvio }}
          aoEnviar={(f) => setFotos((fs) => [...fs, f])}
          aoConcluir={() => router.refresh()}
          rotulo="Adicionar fotos ao portfólio"
        />
      </div>
      {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {fotos.map((f, i) => (
          <li key={f.id} className="overflow-hidden rounded-xl border border-borda bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-superficie">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do painel */}
              <img src={f.miniatura} alt={f.alt} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Excluir"
                onClick={() => excluir(f)}
                className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-red-600 shadow"
              >
                <IconeLixeira className="size-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2 p-3">
              <select value={f.categoria} onChange={(e) => editar(f, { categoria: e.target.value })} className={`${campo} min-h-10 text-sm`} aria-label="Categoria">
                {categorias.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nome}
                  </option>
                ))}
                {!categorias.some((c) => c.slug === f.categoria) && <option value={f.categoria}>{f.categoria || "(sem categoria)"}</option>}
              </select>
              <input
                defaultValue={f.alt}
                maxLength={200}
                placeholder="Descrição da foto (SEO)"
                aria-label="Descrição da foto"
                onBlur={(e) => e.target.value !== f.alt && editar(f, { alt: e.target.value })}
                className={`${campo} min-h-10 text-sm`}
              />
              <div className="flex items-center justify-between">
                <div className="flex">
                  <button type="button" aria-label="Mover para trás" onClick={() => mover(i, -1)} className="inline-flex size-10 items-center justify-center rounded-sm hover:bg-superficie">
                    <IconeSeta direcao="esquerda" className="size-4" />
                  </button>
                  <button type="button" aria-label="Mover para frente" onClick={() => mover(i, 1)} className="inline-flex size-10 items-center justify-center rounded-sm hover:bg-superficie">
                    <IconeSeta direcao="direita" className="size-4" />
                  </button>
                </div>
                <span className="text-xs text-texto-suave">#{i + 1}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
