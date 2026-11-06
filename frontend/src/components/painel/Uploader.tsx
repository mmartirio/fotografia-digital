"use client";

import { useRef, useState } from "react";
import { enviarArquivo } from "@/lib/api";
import { IconeUpload } from "../Icones";

type Item = { nome: string; progresso: number; erro?: string; feito?: boolean };

/**
 * Envio de várias fotos em sequência (uma requisição por foto), com progresso.
 * Aceita arrastar-e-soltar no desktop e seleção da galeria/câmera no celular.
 */
export function Uploader<T>({
  rota,
  campos = {},
  aoEnviar,
  aoConcluir,
  rotulo = "Enviar fotos",
  multiplo = true,
}: {
  rota: string;
  campos?: Record<string, string>;
  aoEnviar?: (resultado: T) => void;
  aoConcluir?: () => void;
  rotulo?: string;
  multiplo?: boolean;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  async function processar(arquivos: File[]) {
    const imagens = arquivos.filter((f) => /\.(jpe?g|png)$/i.test(f.name));
    if (imagens.length === 0) return;
    setEnviando(true);
    setItens(imagens.map((f) => ({ nome: f.name, progresso: 0 })));
    for (let i = 0; i < imagens.length; i++) {
      const atualizar = (parcial: Partial<Item>) => setItens((its) => its.map((it, j) => (j === i ? { ...it, ...parcial } : it)));
      try {
        const r = await enviarArquivo<T>(rota, { ...campos, arquivo: imagens[i] }, (p) => atualizar({ progresso: p }));
        atualizar({ progresso: 1, feito: true });
        aoEnviar?.(r);
      } catch (e) {
        atualizar({ erro: e instanceof Error ? e.message : "Falhou" });
      }
    }
    setEnviando(false);
    aoConcluir?.();
  }

  const concluidos = itens.filter((i) => i.feito).length;
  const falhas = itens.filter((i) => i.erro);

  return (
    <div>
      <button
        type="button"
        disabled={enviando}
        onClick={() => entrada.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          if (!enviando) processar(Array.from(e.dataTransfer.files));
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed p-6 text-sm transition-colors disabled:opacity-60 ${
          arrastando ? "border-destaque bg-agua/30" : "border-borda bg-white hover:border-destaque"
        }`}
      >
        <IconeUpload className="size-8 text-destaque" />
        <span className="font-medium">{enviando ? `Enviando ${concluidos + 1} de ${itens.length}...` : rotulo}</span>
        <span className="text-xs text-texto-suave">JPG ou PNG · toque para escolher ou arraste aqui</span>
      </button>
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png"
        multiple={multiplo}
        className="hidden"
        onChange={(e) => {
          processar(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {itens.length > 0 && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-borda">
            <div
              className="h-full bg-destaque transition-all"
              style={{ width: `${(itens.reduce((s, i) => s + (i.erro ? 1 : i.progresso), 0) / itens.length) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-texto-suave">
            {concluidos} de {itens.length} enviadas{falhas.length > 0 ? ` · ${falhas.length} com erro` : ""}
          </p>
          {falhas.length > 0 && (
            <ul className="mt-2 text-xs text-red-600">
              {falhas.map((f) => (
                <li key={f.nome}>
                  {f.nome}: {f.erro}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
