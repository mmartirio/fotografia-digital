"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IconeLixeira, IconeSeta } from "../Icones";
import { campo, cartao } from "./estilos";
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

/**
 * Fotos do portfólio (seção da tela Imagens): enviar uma ou várias, excluir uma ou várias,
 * mudar categoria, descrição e ordem.
 */
export function PortfolioPainel({
  fotos: iniciais,
  categorias,
  exemplos,
}: {
  fotos: FotoPortfolioApi[];
  categorias: { slug: string; nome: string }[];
  /** Fotos de exemplo que o site mostra enquanto o portfólio está vazio */
  exemplos: string[];
}) {
  const router = useRouter();
  const [fotos, setFotos] = useState(iniciais);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [categoriaEnvio, setCategoriaEnvio] = useState(categorias[0]?.slug ?? "");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    setFotos(iniciais);
    setSelecionadas((s) => new Set([...s].filter((id) => iniciais.some((f) => f.id === id))));
  }, [iniciais]);

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
    await api("/api/painel/portfolio/ordem", { method: "PUT", json: { ids: nova.map((f) => f.id) } }).catch(() =>
      setErro("Não foi possível reordenar."),
    );
  }

  async function excluir(ids: string[]) {
    if (ids.length === 0) return;
    const texto = ids.length === 1 ? "Excluir esta foto do portfólio?" : `Excluir ${ids.length} fotos do portfólio?`;
    if (!window.confirm(`${texto} Não dá para desfazer.`)) return;
    setOcupado(true);
    setErro("");
    try {
      await api("/api/painel/portfolio/excluir", { method: "POST", json: { ids } });
      setFotos((fs) => fs.filter((f) => !ids.includes(f.id)));
      setSelecionadas(new Set());
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível excluir.");
    } finally {
      setOcupado(false);
    }
  }

  async function tornarEditaveis() {
    setOcupado(true);
    setErro("");
    try {
      await api("/api/painel/portfolio/exemplos", { method: "POST" });
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível.");
    } finally {
      setOcupado(false);
    }
  }

  function alternar(id: string) {
    setSelecionadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const todas = fotos.length > 0 && selecionadas.size === fotos.length;

  return (
    <section id="portfolio" className={`${cartao} mt-5 scroll-mt-24`}>
      <h2 className="text-xl">Fotos do portfólio</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Galeria da seção Portfólio do site. Envie uma ou várias fotos de uma vez; para excluir várias, marque as caixas e use
        &ldquo;Excluir selecionadas&rdquo;.
      </p>

      <Categorias categorias={categorias} />

      <div className="mt-4 grid gap-3 sm:grid-cols-[200px_1fr] sm:items-start">
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

      {fotos.length === 0 ? (
        <SemFotos exemplos={exemplos} ocupado={ocupado} aoTornarEditaveis={tornarEditaveis} />
      ) : (
        <>
          {/* Barra de seleção: fica grudada no topo ao rolar a lista */}
          <div className="sticky top-16 z-10 mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-borda bg-white/95 px-3 py-2 backdrop-blur lg:top-2">
            <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-5 accent-[var(--color-destaque)]"
                checked={todas}
                onChange={() => setSelecionadas(todas ? new Set() : new Set(fotos.map((f) => f.id)))}
              />
              Selecionar todas
            </label>
            <span className="text-sm text-texto-suave">
              {selecionadas.size > 0 ? `${selecionadas.size} selecionada(s)` : `${fotos.length} foto(s)`}
            </span>
            <button
              type="button"
              disabled={selecionadas.size === 0 || ocupado}
              onClick={() => excluir([...selecionadas])}
              className="botao-secundario ml-auto min-h-10 px-4 text-red-600 disabled:opacity-40"
            >
              <IconeLixeira className="size-4" />
              {ocupado ? "Excluindo..." : "Excluir selecionadas"}
            </button>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {fotos.map((f, i) => {
              const marcada = selecionadas.has(f.id);
              return (
                <li
                  key={f.id}
                  className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow ${marcada ? "border-destaque ring-2 ring-destaque" : "border-borda"}`}
                >
                  <div className="relative aspect-[4/3] bg-superficie">
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do painel */}
                    <img src={f.miniatura} alt={f.alt} className="h-full w-full object-cover" />
                    <label className="absolute left-2 top-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow">
                      <input
                        type="checkbox"
                        className="size-5 accent-[var(--color-destaque)]"
                        checked={marcada}
                        onChange={() => alternar(f.id)}
                        aria-label={`Selecionar foto ${i + 1}`}
                      />
                    </label>
                    <button
                      type="button"
                      aria-label="Excluir esta foto"
                      disabled={ocupado}
                      onClick={() => excluir([f.id])}
                      className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-red-600 shadow"
                    >
                      <IconeLixeira className="size-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 p-2">
                    <select
                      value={f.categoria}
                      onChange={(e) => editar(f, { categoria: e.target.value })}
                      className={`${campo} min-h-8 py-1 text-xs`}
                      aria-label="Categoria"
                    >
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
                      className={`${campo} min-h-8 py-1 text-xs`}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex">
                        <button
                          type="button"
                          aria-label="Mover para trás"
                          onClick={() => mover(i, -1)}
                          className="inline-flex size-8 items-center justify-center rounded-sm hover:bg-superficie"
                        >
                          <IconeSeta direcao="esquerda" className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Mover para frente"
                          onClick={() => mover(i, 1)}
                          className="inline-flex size-8 items-center justify-center rounded-sm hover:bg-superficie"
                        >
                          <IconeSeta direcao="direita" className="size-4" />
                        </button>
                      </div>
                      <span className="pr-1 text-xs text-texto-suave">#{i + 1}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

/** Portfólio vazio: o site mostra as fotos de exemplo; dá para torná-las editáveis. */
function SemFotos({ exemplos, ocupado, aoTornarEditaveis }: { exemplos: string[]; ocupado: boolean; aoTornarEditaveis: () => void }) {
  return (
    <div className="mt-5 rounded-xl bg-superficie p-4 text-sm">
      <p>
        Você ainda não enviou fotos, então o site mostra <strong>{exemplos.length} fotos de exemplo</strong>. Elas saem do site quando
        você envia a primeira foto sua.
      </p>
      <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {exemplos.slice(0, 8).map((s) => (
          <li key={s}>
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do painel */}
            <img src={s} alt="" className="aspect-square w-full rounded-lg object-cover opacity-70" />
          </li>
        ))}
      </ul>
      <p className="mt-3">Quer manter algumas? Torne-as editáveis para excluir as que não quiser, uma a uma ou várias de uma vez.</p>
      <button type="button" onClick={aoTornarEditaveis} disabled={ocupado} className="botao-secundario mt-3 min-h-10 px-4">
        {ocupado ? "Copiando..." : "Tornar as fotos de exemplo editáveis"}
      </button>
    </div>
  );
}

/** Como gerenciar as categorias (filtros do portfólio no site). */
function Categorias({ categorias }: { categorias: { slug: string; nome: string }[] }) {
  return (
    <details className="group mt-4 rounded-2xl border border-borda bg-white open:shadow-sm">
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
            &ldquo;Aniversários&rdquo;) e o <strong>Identificador</strong> (uma palavra, sem espaços nem acentos, ex.: &ldquo;aniversarios&rdquo;).
          </li>
          <li>
            <strong>Renomear:</strong> altere só o <strong>Nome</strong>. Não mude o Identificador, senão as fotos perdem a categoria.
          </li>
          <li>
            <strong>Mudar a ordem:</strong> use as setas de cada item. <strong>Excluir:</strong> antes, mude as fotos dessa categoria para outra
            aqui embaixo.
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
  );
}
