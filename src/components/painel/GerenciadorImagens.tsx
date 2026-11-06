"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { IconeLixeira } from "../Icones";
import { BotaoEnviarImagem, type ImagemEnviada } from "./EditorConteudo";
import { campo } from "./estilos";
import { PortfolioPainel, type FotoPortfolioApi } from "./PortfolioPainel";

type Obj = Record<string, unknown>;

export type ItemImagem = {
  id: string;
  titulo: string;
  onde: string;
  secao: string;
  /** Campo da seção: objeto {src, largura, altura, alt} ou texto com a URL */
  campo: string;
  valorSecao: Obj;
  proporcao: string;
  /** O que o site mostra se a imagem for excluída */
  semImagem: string;
};

const cartaoCompacto = "rounded-sm border border-borda bg-white p-3 shadow-sm";

export function GerenciadorImagens({
  itens,
  logo,
  fotos,
  categorias,
  exemplos,
}: {
  itens: ItemImagem[];
  logo: string;
  fotos: FotoPortfolioApi[];
  categorias: { slug: string; nome: string }[];
  exemplos: string[];
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl">Imagens</h1>
      <p className="mt-1 text-sm text-texto-suave">
        Todas as imagens do site, na ordem em que aparecem. Ao trocar ou excluir, o site já é atualizado.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-2 lg:[&>*:last-child:nth-child(odd)]:col-span-2">
        {itens.map((item) => (
          <CartaoImagem key={item.id} item={item} />
        ))}

        <section className={`${cartaoCompacto} flex gap-3`}>
          <div className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-superficie p-2 sm:w-32">
            {/* eslint-disable-next-line @next/next/no-img-element -- prévia no painel */}
            {logo ? <img src={logo} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-texto-suave">sem logo</span>}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div>
              <h2 className="text-base font-semibold">Logo</h2>
              <p className="text-xs text-texto-suave">Menu, rodapé e ícone da aba. Trocada em Aparência (remove fundo branco).</p>
            </div>
            <Link href="/painel/site?secao=aparencia" className="botao-secundario min-h-9 w-max px-3 text-xs">
              Trocar logo
            </Link>
          </div>
        </section>
      </div>

      <PortfolioPainel fotos={fotos} categorias={categorias} exemplos={exemplos} />
    </div>
  );
}

/** Cartão compacto: miniatura à esquerda, título e ações à direita. */
function CartaoImagem({ item }: { item: ItemImagem }) {
  const router = useRouter();
  const atual = item.valorSecao[item.campo];
  const ehObjeto = typeof atual === "object" && atual !== null;
  const src = ehObjeto ? String((atual as Obj).src ?? "") : String(atual ?? "");
  const altSalvo = ehObjeto ? String((atual as Obj).alt ?? "") : "";
  const [alt, setAlt] = useState(altSalvo);
  const [estado, setEstado] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function salvar(novo: unknown) {
    setEstado(null);
    try {
      await api(`/api/painel/conteudo/${item.secao}`, { method: "PUT", json: { ...item.valorSecao, [item.campo]: novo } });
      setEstado({ tipo: "ok", texto: "Salvo!" });
      router.refresh();
    } catch (e) {
      setEstado({ tipo: "erro", texto: e instanceof Error ? e.message : "Não foi possível salvar." });
    }
  }

  async function trocar(img: ImagemEnviada) {
    await salvar(ehObjeto ? { ...(atual as Obj), ...img, alt } : img.src);
  }

  async function excluir() {
    if (!window.confirm(`Excluir a imagem "${item.titulo}"? ${item.semImagem}`)) return;
    await salvar(ehObjeto ? { ...(atual as Obj), src: "", largura: 0, altura: 0 } : "");
  }

  return (
    <section className={`${cartaoCompacto} flex gap-3`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- prévia no painel
        <img src={src} alt="" className="size-24 shrink-0 rounded-lg bg-superficie object-cover sm:w-32" />
      ) : (
        <div
          className="flex size-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-borda bg-superficie text-center text-xs text-texto-suave sm:w-32"
          title={item.semImagem}
        >
          Sem imagem
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <h2 className="text-base font-semibold">{item.titulo}</h2>
          <p className="text-xs text-texto-suave">{src ? item.onde : item.semImagem}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 [&_.botao-secundario]:min-h-9 [&_.botao-secundario]:px-3 [&_.botao-secundario]:text-xs">
          <BotaoEnviarImagem aoEnviar={trocar} rotulo={src ? "Trocar" : "Enviar imagem"} />
          {src && (
            <button type="button" onClick={excluir} className="botao-secundario text-red-600">
              <IconeLixeira className="size-3.5" /> Excluir
            </button>
          )}
          {estado && <span className={`text-xs ${estado.tipo === "ok" ? "text-green-700" : "text-red-600"}`}>{estado.texto}</span>}
        </div>
        {ehObjeto && src && (
          <div className="flex gap-2">
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className={`${campo} min-h-9 flex-1 py-1 text-xs`}
              maxLength={200}
              placeholder="Descrição da foto (Google e leitores de tela)"
              aria-label="Descrição da foto"
            />
            {alt !== altSalvo && (
              <button type="button" className="botao-secundario min-h-9 px-3 text-xs" onClick={() => salvar({ ...(atual as Obj), alt })}>
                Salvar
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
