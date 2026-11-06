"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChaveSecao } from "@/conteudo/obter";
import { api, enviarArquivo } from "@/lib/api";
import { IconeLixeira, IconeSeta, IconeUpload } from "../Icones";
import { CampoLogo, CampoNomeLogo, SeletorFonte } from "./CamposAparencia";
import { campo, cartao } from "./estilos";

/**
 * Editor genérico: o formulário é gerado a partir da forma do conteúdo
 * (texto, lista de textos, lista de cartões, imagem). O menu (nav) não é editável.
 */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

const SECOES: Record<ChaveSecao, { nome: string; dica: string }> = {
  aparencia: { nome: "Aparência (logo e fontes)", dica: "Logo, nome ao lado da logo e fontes de todo o site." },
  geral: { nome: "Nome do negócio", dica: "Usado no título da aba do navegador, nos e-mails e no © do rodapé." },
  hero: { nome: "Topo (capa)", dica: "Primeira tela do site: foto grande, título e botões." },
  sobre: { nome: "Sobre", dica: "Sua apresentação, foto e números de destaque." },
  portfolio: { nome: "Portfólio", dica: "Textos e categorias. As fotos ficam no menu Portfólio." },
  servicos: { nome: "Serviços", dica: "Cartões de serviços/pacotes." },
  comoFunciona: { nome: "Como funciona", dica: "Passo a passo do atendimento." },
  depoimentos: { nome: "Depoimentos", dica: "O que os clientes dizem." },
  faq: { nome: "Perguntas frequentes", dica: "Dúvidas comuns (também aparecem no Google)." },
  orcamento: { nome: "Contato (textos)", dica: "Título e texto da seção de contato." },
  ctaFinal: { nome: "Chamada final", dica: "Faixa com foto antes do rodapé." },
  rodape: {
    nome: "Rodapé",
    dica: "Slogan, texto de atendimento e direitos autorais. O nome e as cores da logo ficam em Aparência; WhatsApp e Instagram em Contato.",
  },
  contato: { nome: "Contato", dica: "WhatsApp e Instagram usados em todo o site." },
  seo: {
    nome: "SEO (Google)",
    dica: "Atenção: estes textos NÃO aparecem na página. Eles definem o título da aba do navegador, o resultado no Google e a prévia ao compartilhar o link no WhatsApp.",
  },
};

const ROTULOS: Record<string, string> = {
  marca: "Nome",
  slogan: "Slogan",
  etiqueta: "Etiqueta (texto pequeno acima do título)",
  titulo: "Título",
  subtitulo: "Subtítulo",
  ctaPrimario: "Botão principal",
  ctaSecundario: "Botão secundário",
  texto: "Texto",
  href: "Link (ex.: #orcamento)",
  imagem: "Imagem",
  paragrafos: "Parágrafos",
  numeros: "Números em destaque",
  valor: "Valor",
  rotulo: "Legenda",
  categorias: "Categorias",
  slug: "Identificador (uma palavra, sem espaços nem acentos; não altere depois de criar)",
  nome: "Nome",
  itens: "Itens",
  descricao: "Descrição",
  preco: "Preço",
  inclui: "O que inclui",
  destaque: "Destacar este item",
  observacao: "Observação",
  passos: "Passos",
  ensaio: "Tipo de trabalho",
  pergunta: "Pergunta",
  resposta: "Resposta",
  botao: "Texto do botão",
  whatsapp: "WhatsApp (só números: 55 + DDD + número)",
  mensagemWhatsapp: "Mensagem automática do WhatsApp",
  instagram: "Instagram (sem @)",
  cidade: "Cidade / área de atendimento",
  imagemOg: "Imagem ao compartilhar o link",
  alt: "Descrição da imagem (acessibilidade e Google)",
  logo: "Logo",
  nomeLogo: "Nome ao lado da logo",
  fonteTitulos: "Fonte dos títulos",
  fonteTexto: "Fonte dos textos",
  atendimento: "Texto abaixo do slogan",
  direitos: "Direitos autorais (aparece depois de “© ano Nome.”)",
  mostrarAreaCliente: "Mostrar o link “Área do cliente” no rodapé",
};

/** Onde cada seção aparece no site (para o botão "Ver no site"). */
const ANCORAS: Record<ChaveSecao, string> = {
  aparencia: "#inicio",
  geral: "#rodape",
  hero: "#inicio",
  sobre: "#sobre",
  portfolio: "#portfolio",
  servicos: "#servicos",
  comoFunciona: "#como-funciona",
  depoimentos: "#depoimentos",
  faq: "#faq",
  orcamento: "#orcamento",
  ctaFinal: "#chamada-final",
  rodape: "#rodape",
  contato: "#orcamento",
  seo: "",
};

const LONGOS = new Set(["subtitulo", "descricao", "resposta", "mensagem", "texto", "paragrafos", "mensagemWhatsapp"]);
const ESCONDIDOS = new Set(["largura", "altura", "src"]);

function rotulo(k: string): string {
  return ROTULOS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function ehImagem(v: Json): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "src" in v && "largura" in v;
}

/** Item vazio com a mesma forma (para "adicionar" em listas). */
function vazio(modelo: Json): Json {
  if (typeof modelo === "string") return "";
  if (typeof modelo === "number") return 0;
  if (typeof modelo === "boolean") return false;
  if (Array.isArray(modelo)) return [];
  if (modelo && typeof modelo === "object") return Object.fromEntries(Object.entries(modelo).map(([k, v]) => [k, vazio(v)]));
  return null;
}

function definir(raiz: Json, caminho: (string | number)[], valor: Json): Json {
  if (caminho.length === 0) return valor;
  const [chave, ...resto] = caminho;
  if (Array.isArray(raiz)) {
    const copia = [...raiz];
    copia[chave as number] = definir(copia[chave as number], resto, valor);
    return copia;
  }
  const obj = { ...(raiz as Obj) };
  obj[chave as string] = definir(obj[chave as string], resto, valor);
  return obj;
}

export function EditorConteudo({
  valores,
  padroes,
  personalizadas,
  inicial,
}: {
  valores: Record<ChaveSecao, Record<string, unknown>>;
  padroes: Record<ChaveSecao, Record<string, unknown>>;
  personalizadas: string[];
  inicial: ChaveSecao;
}) {
  const router = useRouter();
  const [secao, setSecao] = useState<ChaveSecao>(inicial);
  const [rascunho, setRascunho] = useState<Obj>(valores[inicial] as Obj);
  const [alterado, setAlterado] = useState(false);
  const [estado, setEstado] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setRascunho(valores[secao] as Obj);
    setAlterado(false);
  }, [secao, valores]);

  // Aviso ao sair com alterações não salvas
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => alterado && e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  function trocarSecao(nova: ChaveSecao) {
    if (alterado && !window.confirm("Há alterações não salvas. Descartar?")) return;
    setSecao(nova);
    setEstado(null);
    window.history.replaceState(null, "", `?secao=${nova}`);
  }

  function mudar(caminho: (string | number)[], valor: Json) {
    setRascunho((r) => definir(r, caminho, valor) as Obj);
    setAlterado(true);
    setEstado(null);
  }

  async function salvar() {
    setSalvando(true);
    try {
      await api(`/api/painel/conteudo/${secao}`, { method: "PUT", json: rascunho });
      setAlterado(false);
      setEstado({ tipo: "ok", texto: "Salvo! As mudanças já estão no site." });
      router.refresh();
    } catch (e) {
      setEstado({ tipo: "erro", texto: e instanceof Error ? e.message : "Não foi possível salvar." });
    } finally {
      setSalvando(false);
    }
  }

  async function restaurar() {
    if (!window.confirm(`Voltar "${SECOES[secao].nome}" ao conteúdo original?`)) return;
    await api(`/api/painel/conteudo/${secao}`, { method: "DELETE" });
    setRascunho(padroes[secao] as Obj);
    setAlterado(false);
    setEstado({ tipo: "ok", texto: "Conteúdo original restaurado." });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl">Editar site</h1>
      <p className="mt-1 text-sm text-texto-suave">Edite os textos e imagens de cada parte do site. O menu de navegação é fixo.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Seções */}
        <select value={secao} onChange={(e) => trocarSecao(e.target.value as ChaveSecao)} className={`${campo} lg:hidden`} aria-label="Seção">
          {Object.entries(SECOES).map(([k, s]) => (
            <option key={k} value={k}>
              {s.nome}
            </option>
          ))}
        </select>
        <nav className="hidden flex-col gap-1 lg:flex" aria-label="Seções">
          {(Object.keys(SECOES) as ChaveSecao[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => trocarSecao(k)}
              className={`flex min-h-10 items-center justify-between rounded-sm px-3 text-left text-sm ${secao === k ? "bg-destaque text-white" : "hover:bg-white"}`}
            >
              {SECOES[k].nome}
              {personalizadas.includes(k) && <span className={`size-2 rounded-full ${secao === k ? "bg-white" : "bg-celeste"}`} title="Personalizada" />}
            </button>
          ))}
        </nav>

        {/* Formulário */}
        <div className="min-w-0">
          <div className={cartao}>
            <h2 className="text-2xl">{SECOES[secao].nome}</h2>
            <p className={`mt-1 text-sm ${secao === "seo" ? "rounded-sm bg-amber-50 p-2 text-amber-800" : "text-texto-suave"}`}>{SECOES[secao].dica}</p>
            {secao === "seo" && <PreviaGoogle titulo={String(rascunho.titulo ?? "")} descricao={String(rascunho.descricao ?? "")} />}
            <div className="mt-5 flex flex-col gap-5">
              {Object.entries(rascunho).map(([k, v]) => (
                <Campo key={`${secao}-${k}`} chave={k} valor={v} caminho={[k]} aoMudar={mudar} irmaos={rascunho} />
              ))}
            </div>
          </div>

          {/* Barra de salvar */}
          <div
            className={`sticky bottom-16 z-20 mt-4 flex flex-wrap items-center gap-3 rounded-sm border p-3 shadow-lg backdrop-blur lg:bottom-4 ${
              alterado ? "border-amber-400 bg-amber-50/95" : "border-borda bg-white/95"
            }`}
          >
            <button type="button" onClick={salvar} disabled={!alterado || salvando} className="botao-primario disabled:opacity-50">
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
            {personalizadas.includes(secao) && (
              <button type="button" onClick={restaurar} className="text-sm text-texto-suave underline">
                Restaurar original
              </button>
            )}
            {alterado && !estado && <span className="text-sm text-amber-700">Alterações não salvas</span>}
            {estado && <span className={`text-sm ${estado.tipo === "ok" ? "text-emerald-700" : "text-red-600"}`}>{estado.texto}</span>}
            <a href={`/${ANCORAS[secao]}`} target="_blank" rel="noopener" className="ml-auto text-sm font-medium text-destaque hover:underline">
              Ver no site ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({
  chave,
  valor,
  caminho,
  aoMudar,
  irmaos,
}: {
  chave: string;
  valor: Json;
  caminho: (string | number)[];
  aoMudar: (c: (string | number)[], v: Json) => void;
  /** Demais campos da seção (para campos que dependem de outros, ex.: cores do nome). */
  irmaos?: Obj;
}) {
  if (ESCONDIDOS.has(chave)) return null;
  if (chave === "coresNome") return null; // editadas junto com o nome (CampoNomeLogo)

  // Aparência: campos especiais
  if (chave === "logo" && typeof valor === "string") return <CampoLogo valor={valor} aoMudar={(v) => aoMudar(caminho, v)} />;
  if (chave === "nomeLogo" && typeof valor === "string") {
    const cores = Array.isArray(irmaos?.coresNome) ? (irmaos.coresNome as string[]) : [];
    return (
      <CampoNomeLogo
        valor={valor}
        cores={cores}
        aoMudar={(v) => aoMudar(caminho, v)}
        aoMudarCores={(v) => aoMudar(["coresNome"], v)}
      />
    );
  }
  if ((chave === "fonteTitulos" || chave === "fonteTexto") && typeof valor === "string") {
    return <SeletorFonte rotulo={rotulo(chave)} valor={valor} titulos={chave === "fonteTitulos"} aoMudar={(v) => aoMudar(caminho, v)} />;
  }

  if (ehImagem(valor)) return <CampoImagem chave={chave} valor={valor} caminho={caminho} aoMudar={aoMudar} />;

  if (typeof valor === "boolean") {
    return (
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={valor} onChange={(e) => aoMudar(caminho, e.target.checked)} className="size-5 accent-destaque" />
        {rotulo(chave)}
      </label>
    );
  }

  if (typeof valor === "string" && /imagem/i.test(chave)) {
    return <CampoImagemTexto chave={chave} valor={valor} caminho={caminho} aoMudar={aoMudar} />;
  }

  if (typeof valor === "string" || typeof valor === "number") {
    const longo = LONGOS.has(chave) || String(valor).length > 70;
    return (
      <label className="flex flex-col gap-1 text-sm font-medium">
        {rotulo(chave)}
        {longo ? (
          <textarea value={String(valor)} rows={3} onChange={(e) => aoMudar(caminho, e.target.value)} className={campo} />
        ) : (
          <input value={String(valor)} onChange={(e) => aoMudar(caminho, e.target.value)} className={campo} />
        )}
      </label>
    );
  }

  if (Array.isArray(valor)) {
    const modelo = valor[0] ?? "";
    const deTexto = typeof modelo === "string";
    const mover = (i: number, p: number) => {
      const j = i + p;
      if (j < 0 || j >= valor.length) return;
      const nova = [...valor];
      [nova[i], nova[j]] = [nova[j], nova[i]];
      aoMudar(caminho, nova);
    };
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{rotulo(chave)}</legend>
        {valor.map((item, i) => (
          <div key={i} className={deTexto ? "flex items-start gap-1" : "rounded-sm border border-borda bg-superficie/60 p-3"}>
            {deTexto ? (
              <>
                {LONGOS.has(chave) || String(item).length > 70 ? (
                  <textarea value={String(item)} rows={3} onChange={(e) => aoMudar([...caminho, i], e.target.value)} className={campo} aria-label={`${rotulo(chave)} ${i + 1}`} />
                ) : (
                  <input value={String(item)} onChange={(e) => aoMudar([...caminho, i], e.target.value)} className={campo} aria-label={`${rotulo(chave)} ${i + 1}`} />
                )}
                <AcoesItem aoSubir={() => mover(i, -1)} aoDescer={() => mover(i, 1)} aoRemover={() => aoMudar(caminho, valor.filter((_, j) => j !== i))} />
              </>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-texto-suave">Item {i + 1}</span>
                  <AcoesItem aoSubir={() => mover(i, -1)} aoDescer={() => mover(i, 1)} aoRemover={() => aoMudar(caminho, valor.filter((_, j) => j !== i))} />
                </div>
                <div className="flex flex-col gap-3">
                  {Object.entries(item as Obj).map(([k, v]) => (
                    <Campo key={k} chave={k} valor={v} caminho={[...caminho, i, k]} aoMudar={aoMudar} />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
        <button type="button" onClick={() => aoMudar(caminho, [...valor, vazio(modelo)])} className="self-start text-sm font-medium text-destaque">
          + Adicionar
        </button>
      </fieldset>
    );
  }

  if (valor && typeof valor === "object") {
    return (
      <fieldset className="rounded-sm border border-borda p-3">
        <legend className="px-1 text-sm font-medium">{rotulo(chave)}</legend>
        <div className="flex flex-col gap-3">
          {Object.entries(valor as Obj).map(([k, v]) => (
            <Campo key={k} chave={k} valor={v} caminho={[...caminho, k]} aoMudar={aoMudar} />
          ))}
        </div>
      </fieldset>
    );
  }
  return null;
}

function AcoesItem({ aoSubir, aoDescer, aoRemover }: { aoSubir: () => void; aoDescer: () => void; aoRemover: () => void }) {
  const b = "inline-flex size-9 shrink-0 items-center justify-center rounded-sm hover:bg-white";
  return (
    <div className="flex">
      <button type="button" aria-label="Subir" onClick={aoSubir} className={b}>
        <IconeSeta direcao="esquerda" className="size-4 rotate-90" />
      </button>
      <button type="button" aria-label="Descer" onClick={aoDescer} className={b}>
        <IconeSeta direcao="direita" className="size-4 rotate-90" />
      </button>
      <button type="button" aria-label="Remover" onClick={aoRemover} className={`${b} text-red-600`}>
        <IconeLixeira className="size-4" />
      </button>
    </div>
  );
}

type ImagemEnviada = { src: string; largura: number; altura: number };

function BotaoEnviarImagem({ aoEnviar }: { aoEnviar: (img: ImagemEnviada) => void }) {
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  return (
    <div>
      <label className="botao-secundario min-h-10 cursor-pointer px-4">
        <IconeUpload className="size-4" />
        {progresso !== null ? `Enviando ${Math.round(progresso * 100)}%` : "Trocar imagem"}
        <input
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={async (e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = "";
            if (!arquivo) return;
            setErro("");
            setProgresso(0);
            try {
              aoEnviar(await enviarArquivo<ImagemEnviada>("/api/painel/imagens", { arquivo }, setProgresso));
            } catch (err) {
              setErro(err instanceof Error ? err.message : "Falhou.");
            } finally {
              setProgresso(null);
            }
          }}
        />
      </label>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}

function CampoImagem({ chave, valor, caminho, aoMudar }: { chave: string; valor: Obj; caminho: (string | number)[]; aoMudar: (c: (string | number)[], v: Json) => void }) {
  return (
    <fieldset className="rounded-sm border border-borda p-3">
      <legend className="px-1 text-sm font-medium">{rotulo(chave)}</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element -- prévia no painel */}
        <img src={String(valor.src)} alt="" className="aspect-[4/3] w-full rounded-xl object-cover sm:w-48" />
        <div className="flex flex-1 flex-col gap-3">
          <BotaoEnviarImagem aoEnviar={(img) => aoMudar(caminho, { ...valor, ...img })} />
          <label className="flex flex-col gap-1 text-sm font-medium">
            {rotulo("alt")}
            <input value={String(valor.alt ?? "")} onChange={(e) => aoMudar([...caminho, "alt"], e.target.value)} className={campo} />
          </label>
        </div>
      </div>
    </fieldset>
  );
}

function CampoImagemTexto({ chave, valor, caminho, aoMudar }: { chave: string; valor: string; caminho: (string | number)[]; aoMudar: (c: (string | number)[], v: Json) => void }) {
  return (
    <fieldset className="rounded-sm border border-borda p-3">
      <legend className="px-1 text-sm font-medium">{rotulo(chave)}</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- prévia no painel */}
        {valor && <img src={valor} alt="" className="aspect-[1.91/1] w-full rounded-xl object-cover sm:w-48" />}
        <BotaoEnviarImagem aoEnviar={(img) => aoMudar(caminho, img.src)} />
      </div>
    </fieldset>
  );
}

/** Como o site aparece no resultado do Google (aproximação). */
function PreviaGoogle({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-borda bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">Prévia no Google</p>
      <p className="mt-2 text-xs text-[#202124]">davifotovideo.com.br</p>
      <p className="truncate text-lg text-[#1a0dab]">{titulo || "(sem título)"}</p>
      <p className="line-clamp-2 text-sm text-[#4d5156]">{descricao || "(sem descrição)"}</p>
      <p className={`mt-2 text-xs ${titulo.length > 60 || descricao.length > 160 ? "text-amber-700" : "text-texto-suave"}`}>
        Título: {titulo.length}/60 · Descrição: {descricao.length}/160 caracteres recomendados
      </p>
    </div>
  );
}
