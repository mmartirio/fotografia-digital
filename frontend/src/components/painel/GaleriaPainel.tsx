"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { linkWhatsapp } from "@/lib/contato";
import { diasRestantes, formatarData, formatarDataHora, urlFoto, type FotoDto, type GaleriaDetalhe } from "@/lib/galeria";
import { IconeComentario, IconeCoracao, IconeLixeira, IconeSeta } from "../Icones";
import { SeloStatus } from "../galeria/SeloStatus";
import { Visualizador } from "../galeria/Visualizador";
import { cartao } from "./estilos";
import { Uploader } from "./Uploader";

type Aba = "originais" | "selecao" | "finais";

export function GaleriaPainel({ detalhe }: { detalhe: GaleriaDetalhe }) {
  const router = useRouter();
  const { resumo, originais, finais } = detalhe;
  const g = resumo.id;
  const st = resumo.status;
  const selecionadas = originais.filter((f) => f.selecionada);
  const [aba, setAba] = useState<Aba>(
    st === "ENTREGUE" || st === "EXPIRADA" ? "finais" : st === "SELECAO_ENVIADA" || st === "EM_TRATAMENTO" ? "selecao" : "originais",
  );
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const podeOriginais = st === "CRIADA" || st === "AGUARDANDO_SELECAO";
  const podeFinais = st === "SELECAO_ENVIADA" || st === "EM_TRATAMENTO" || st === "ENTREGUE";

  async function acao(rota: string, confirmacao: string, sucesso: string) {
    if (!window.confirm(confirmacao)) return;
    setOcupado(true);
    try {
      await api(`/api/painel/galerias/${g}/${rota}`, { method: "POST" });
      setMensagem({ tipo: "ok", texto: sucesso });
      router.refresh();
    } catch (e) {
      setMensagem({ tipo: "erro", texto: e instanceof Error ? e.message : "Falhou." });
    } finally {
      setOcupado(false);
    }
  }

  async function excluirGaleria() {
    const resposta = window.prompt(`Isto apaga a galeria e TODAS as fotos de "${resumo.titulo}". Digite EXCLUIR para confirmar.`);
    if (resposta !== "EXCLUIR") return;
    await api(`/api/painel/galerias/${g}`, { method: "DELETE" });
    router.replace("/painel/galerias");
    router.refresh();
  }

  const excluirFoto = useCallback(
    async (f: FotoDto) => {
      if (!window.confirm(`Excluir ${f.nomeOriginal}?`)) return;
      try {
        await api(`/api/painel/galerias/${g}/fotos/${f.id}`, { method: "DELETE" });
        router.refresh();
      } catch (e) {
        setMensagem({ tipo: "erro", texto: e instanceof Error ? e.message : "Falhou." });
      }
    },
    [g, router],
  );

  const cliente = resumo.cliente;
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/painel/galerias" className="inline-flex min-h-11 items-center gap-1 text-sm text-texto-suave hover:text-destaque">
        <IconeSeta direcao="esquerda" className="size-4" /> Galerias
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl">{resumo.titulo}</h1>
            <SeloStatus status={st} />
          </div>
          {cliente && (
            <p className="mt-2 text-sm text-texto-suave">
              {cliente.nome} · <a href={`mailto:${cliente.email}`} className="underline">{cliente.email}</a>
              {cliente.telefone && (
                <>
                  {" · "}
                  <a href={linkWhatsapp(cliente.telefone.replace(/\D/g, "").replace(/^(?!55)/, "55"))} target="_blank" rel="noopener noreferrer" className="underline">
                    {cliente.telefone}
                  </a>
                </>
              )}
            </p>
          )}
          <p className="mt-1 text-xs text-texto-suave">
            Criada {formatarData(resumo.criadoEm)}
            {resumo.selecaoEnviadaEm && ` · seleção em ${formatarDataHora(resumo.selecaoEnviadaEm)}`}
            {resumo.entregueEm && ` · entregue ${formatarData(resumo.entregueEm)}`}
            {resumo.expiraEm && ` · expira ${formatarData(resumo.expiraEm)} (${diasRestantes(resumo.expiraEm)} dias)`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {st === "CRIADA" && (
            <button
              type="button"
              disabled={ocupado || originais.length === 0}
              onClick={() => acao("liberar", `Liberar ${originais.length} fotos para ${cliente?.nome}? Ele receberá um e-mail com o link de acesso.`, "Galeria liberada! O cliente recebeu o e-mail.")}
              className="botao-primario disabled:opacity-50"
            >
              Liberar para o cliente
            </button>
          )}
          {st === "SELECAO_ENVIADA" && (
            <button type="button" disabled={ocupado} onClick={() => acao("tratamento", "Marcar como em tratamento?", "Status atualizado.")} className="botao-primario">
              Iniciar tratamento
            </button>
          )}
          {(st === "SELECAO_ENVIADA" || st === "EM_TRATAMENTO") && (
            <button
              type="button"
              disabled={ocupado || finais.length === 0}
              onClick={() => acao("entregar", `Entregar ${finais.length} fotos tratadas? O cliente recebe um e-mail e o prazo de download começa a contar.`, "Fotos entregues! O cliente recebeu o e-mail.")}
              className="botao-primario disabled:opacity-50"
            >
              Entregar fotos
            </button>
          )}
          <button type="button" onClick={excluirGaleria} className="botao-secundario text-red-600 hover:border-red-600 hover:text-red-600">
            Excluir
          </button>
        </div>
      </div>

      {st === "CRIADA" && (
        <p className="mt-4 rounded-sm bg-amber-50 p-3 text-sm text-amber-800">
          Rascunho: o cliente ainda não vê esta galeria. Envie as fotos e clique em <strong>Liberar para o cliente</strong>.
        </p>
      )}
      {mensagem && (
        <p role="status" className={`mt-4 rounded-sm p-3 text-sm ${mensagem.tipo === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {mensagem.texto}
        </p>
      )}

      {/* Abas */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-borda [scrollbar-width:none]">
        {(
          [
            ["originais", `Fotos para seleção (${originais.length})`],
            ["selecao", `Seleção do cliente (${selecionadas.length}${resumo.limiteFotos ? `/${resumo.limiteFotos}` : ""})`],
            ["finais", `Fotos tratadas (${finais.length})`],
          ] as const
        ).map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={`min-h-11 shrink-0 border-b-2 px-4 text-sm ${aba === chave ? "border-destaque font-medium text-destaque" : "border-transparent text-texto-suave"}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {aba === "originais" && (
          <>
            {podeOriginais ? (
              <Uploader rota={`/api/painel/galerias/${g}/fotos`} campos={{ tipo: "ORIGINAL" }} aoConcluir={() => router.refresh()} rotulo="Enviar fotos para seleção" />
            ) : (
              <p className="text-sm text-texto-suave">A seleção já foi enviada; não é possível adicionar fotos para seleção.</p>
            )}
            <GradeFotos galeria={g} fotos={originais} aoExcluir={podeOriginais ? excluirFoto : undefined} mostrarSelecao />
          </>
        )}

        {aba === "selecao" && <AbaSelecao detalhe={detalhe} />}

        {aba === "finais" && (
          <>
            {podeFinais ? (
              <Uploader rota={`/api/painel/galerias/${g}/fotos`} campos={{ tipo: "FINAL" }} aoConcluir={() => router.refresh()} rotulo="Enviar fotos tratadas" />
            ) : (
              <p className="text-sm text-texto-suave">
                {st === "EXPIRADA" ? "Galeria expirada: os arquivos foram excluídos." : "As fotos tratadas podem ser enviadas depois que o cliente enviar a seleção."}
              </p>
            )}
            <GradeFotos galeria={g} fotos={finais} aoExcluir={podeFinais ? excluirFoto : undefined} />
          </>
        )}
      </div>
    </div>
  );
}

function AbaSelecao({ detalhe }: { detalhe: GaleriaDetalhe }) {
  const escolhidas = detalhe.originais.filter((f) => f.selecionada);
  const comPedido = escolhidas.filter((f) => f.comentario);
  const extras = detalhe.resumo.limiteFotos ? Math.max(0, escolhidas.length - detalhe.resumo.limiteFotos) : 0;

  if (detalhe.resumo.status === "CRIADA" || detalhe.resumo.status === "AGUARDANDO_SELECAO") {
    return (
      <p className="text-sm text-texto-suave">
        {escolhidas.length > 0
          ? `O cliente está escolhendo: ${escolhidas.length} foto(s) marcadas até agora (ainda não enviou).`
          : "O cliente ainda não começou a seleção."}
      </p>
    );
  }

  // Nomes sem extensão, separados por vírgula: cole na busca de texto do Lightroom
  const nomes = escolhidas.map((f) => f.nomeOriginal.replace(/\.[^.]+$/, "")).join(", ");
  return (
    <div className="flex flex-col gap-5">
      <div className={cartao}>
        <p className="text-sm">
          <strong>{escolhidas.length}</strong> fotos escolhidas
          {extras > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{extras} extras além do pacote</span>}
        </p>
        {detalhe.observacaoCliente && (
          <blockquote className="mt-3 border-l-4 border-agua pl-3 text-sm italic text-texto-suave">&ldquo;{detalhe.observacaoCliente}&rdquo;</blockquote>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <BotaoCopiar texto={nomes} rotulo="Copiar nomes dos arquivos (Lightroom)" />
          {comPedido.length > 0 && (
            <BotaoCopiar
              texto={comPedido.map((f) => `${f.nomeOriginal}: ${f.comentario}`).join("\n")}
              rotulo={`Copiar pedidos de edição (${comPedido.length})`}
            />
          )}
        </div>
      </div>

      {/* Lista de trabalho: o que o cliente pediu em cada foto */}
      {comPedido.length > 0 && (
        <section className={cartao}>
          <h3 className="text-xl">Pedidos de edição ({comPedido.length})</h3>
          <ul className="mt-3 divide-y divide-borda">
            {comPedido.map((f) => (
              <li key={f.id} className="flex gap-3 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada (cookie) */}
                <img src={urlFoto("painel", detalhe.resumo.id, f.id, "miniatura")} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-xs text-texto-suave">{f.nomeOriginal}</p>
                  <p className="text-sm">{f.comentario}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <GradeFotos galeria={detalhe.resumo.id} fotos={escolhidas} mostrarComentario />
    </div>
  );
}

function BotaoCopiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="botao-secundario"
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
    >
      {copiado ? "Copiado! ✓" : rotulo}
    </button>
  );
}

function GradeFotos({
  galeria,
  fotos,
  aoExcluir,
  mostrarSelecao = false,
  mostrarComentario = false,
}: {
  galeria: string;
  fotos: FotoDto[];
  aoExcluir?: (f: FotoDto) => void;
  mostrarSelecao?: boolean;
  mostrarComentario?: boolean;
}) {
  const [aberta, setAberta] = useState<number | null>(null);
  const navegar = useCallback((p: number) => setAberta((i) => (i === null ? i : (i + p + fotos.length) % fotos.length)), [fotos.length]);
  const fechar = useCallback(() => setAberta(null), []);
  const atual = aberta !== null ? fotos[aberta] : null;
  if (fotos.length === 0) return null;

  return (
    <>
      <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {fotos.map((f, i) => (
          <li key={f.id} className="group relative">
            <button type="button" onClick={() => setAberta(i)} className="block aspect-square w-full overflow-hidden rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada (cookie) */}
              <img src={urlFoto("painel", galeria, f.id, "miniatura")} alt={f.nomeOriginal} loading="lazy" className="h-full w-full object-cover" />
            </button>
            {mostrarSelecao && f.selecionada && (
              <span className="absolute left-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-red-500">
                <IconeCoracao cheio className="size-4" />
              </span>
            )}
            {f.comentario && (
              <span className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-destaque" title={f.comentario}>
                <IconeComentario className="size-4" />
              </span>
            )}
            {aoExcluir && (
              <button
                type="button"
                aria-label={`Excluir ${f.nomeOriginal}`}
                onClick={() => aoExcluir(f)}
                className="absolute bottom-1 right-1 inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-red-600 opacity-100 shadow lg:opacity-0 lg:group-hover:opacity-100"
              >
                <IconeLixeira className="size-4" />
              </button>
            )}
            <p className="mt-1 truncate text-[11px] text-texto-suave">{f.nomeOriginal}</p>
            {mostrarComentario && f.comentario && <p className="text-xs text-texto">✏️ {f.comentario}</p>}
          </li>
        ))}
      </ul>
      {atual && (
        <Visualizador
          aberto
          src={urlFoto("painel", galeria, atual.id, "previa")}
          legenda={atual.comentario ? `${atual.nomeOriginal} · 💬 ${atual.comentario}` : atual.nomeOriginal}
          posicao={aberta ?? 0}
          total={fotos.length}
          aoFechar={fechar}
          aoNavegar={navegar}
        />
      )}
    </>
  );
}
