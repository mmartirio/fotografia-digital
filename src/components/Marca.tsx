import type { CSSProperties } from "react";
import type { ConteudoSite } from "@/conteudo/tipos";

/** Cores padrão da logo DAVIFOTOVIDEO: grafite, azul, celeste. */
export const CORES_NOME_PADRAO = ["#38383f", "#3070b8", "#48a8e0"];

const HEX = /^#[0-9a-f]{6}$/i;

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Cor da parte i; em fundo escuro, cores muito escuras viram branco para manter a leitura. */
export function corDaParte(cores: string[] | undefined, i: number, claro: boolean): string {
  const lista = (cores ?? []).filter((c) => HEX.test(c));
  const base = lista.length ? lista : CORES_NOME_PADRAO;
  const cor = base[i % base.length];
  return claro && luminancia(cor) < 0.35 ? "#ffffff" : cor;
}

/**
 * Nome em texto ao lado da logo. "|" separa partes, cada uma com sua cor
 * (definidas no painel → Aparência). `claro`: versão para fundo escuro.
 */
export function Marca({
  nome = "DAVI|FOTO|VIDEO",
  cores,
  claro = false,
  className = "",
}: {
  nome?: string;
  cores?: string[];
  claro?: boolean;
  className?: string;
}) {
  const partes = nome.split("|").filter((p) => p.length > 0);
  return (
    <span className={`font-marca leading-none tracking-wide ${className}`}>
      {partes.map((p, i) => (
        <span key={i} style={{ color: corDaParte(cores, i, claro) } as CSSProperties}>
          {p}
        </span>
      ))}
    </span>
  );
}

/** Logo (imagem) + nome, como no nav. */
export function LogoMarca({
  aparencia,
  claro = false,
  tamanhoIcone = "h-9 lg:h-11",
  tamanhoNome = "text-[1.7rem] lg:text-3xl",
}: {
  aparencia: ConteudoSite["aparencia"];
  claro?: boolean;
  tamanhoIcone?: string;
  tamanhoNome?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      {aparencia.logo && (
        // eslint-disable-next-line @next/next/no-img-element -- logo pequena, pode vir do painel (PNG transparente)
        <img src={aparencia.logo} alt="" className={`${tamanhoIcone} w-auto`} />
      )}
      {aparencia.nomeLogo.trim() && <Marca nome={aparencia.nomeLogo} cores={aparencia.coresNome} claro={claro} className={tamanhoNome} />}
    </span>
  );
}
