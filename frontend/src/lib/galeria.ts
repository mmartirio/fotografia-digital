/** Tipos e utilitários de galeria compartilhados pela área do cliente e pelo painel. */

export type StatusGaleria =
  | "CRIADA"
  | "AGUARDANDO_SELECAO"
  | "SELECAO_ENVIADA"
  | "EM_TRATAMENTO"
  | "ENTREGUE"
  | "EXPIRADA";

export type ClienteDto = { id: string; nome: string; email: string; telefone: string | null };

export type GaleriaResumo = {
  id: string;
  titulo: string;
  status: StatusGaleria;
  limiteFotos: number | null;
  totalOriginais: number;
  selecionadas: number;
  totalFinais: number;
  criadoEm: string;
  selecaoEnviadaEm: string | null;
  entregueEm: string | null;
  expiraEm: string | null;
  capaFotoId: string | null;
  cliente: ClienteDto | null;
};

export type FotoDto = {
  id: string;
  tipo: "ORIGINAL" | "FINAL";
  nomeOriginal: string;
  largura: number | null;
  altura: number | null;
  tamanhoBytes: number;
  selecionada: boolean;
  comentario: string | null;
};

export type GaleriaDetalhe = {
  resumo: GaleriaResumo;
  observacaoCliente: string | null;
  originais: FotoDto[];
  finais: FotoDto[];
};

export const ROTULO_STATUS: Record<StatusGaleria, string> = {
  CRIADA: "Rascunho",
  AGUARDANDO_SELECAO: "Aguardando seleção",
  SELECAO_ENVIADA: "Seleção enviada",
  EM_TRATAMENTO: "Em tratamento",
  ENTREGUE: "Fotos entregues",
  EXPIRADA: "Expirada",
};

export const COR_STATUS: Record<StatusGaleria, string> = {
  CRIADA: "bg-slate-100 text-slate-700",
  AGUARDANDO_SELECAO: "bg-amber-100 text-amber-800",
  SELECAO_ENVIADA: "bg-sky-100 text-sky-800",
  EM_TRATAMENTO: "bg-violet-100 text-violet-800",
  ENTREGUE: "bg-emerald-100 text-emerald-800",
  EXPIRADA: "bg-slate-200 text-slate-500",
};

const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Maceio" });
const fmtDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Maceio",
});

export function formatarData(iso: string | null | undefined): string {
  return iso ? fmtData.format(new Date(iso)) : "—";
}

export function formatarDataHora(iso: string | null | undefined): string {
  return iso ? fmtDataHora.format(new Date(iso)) : "—";
}

export function diasRestantes(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** URL de imagem de uma foto (área do cliente ou painel). */
export function urlFoto(
  base: "cliente" | "painel",
  galeriaId: string,
  fotoId: string,
  variante: "miniatura" | "previa" | "download",
): string {
  const prefixo = base === "cliente" ? "/api/cliente/galerias" : "/api/painel/galerias";
  return `${prefixo}/${galeriaId}/fotos/${fotoId}/${variante}`;
}
