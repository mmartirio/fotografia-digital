import { COR_STATUS, ROTULO_STATUS, type StatusGaleria } from "@/lib/galeria";

export function SeloStatus({ status, className = "" }: { status: StatusGaleria; className?: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${COR_STATUS[status]} ${className}`}>
      {ROTULO_STATUS[status]}
    </span>
  );
}
