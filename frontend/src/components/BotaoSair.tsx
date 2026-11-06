"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BotaoSair({ rota, destino, className = "" }: { rota: string; destino: string; className?: string }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  return (
    <button
      type="button"
      disabled={saindo}
      className={`botao-secundario min-h-10 px-4 ${className}`}
      onClick={async () => {
        setSaindo(true);
        await fetch(rota, { method: "POST" }).catch(() => undefined);
        router.replace(destino);
        router.refresh();
      }}
    >
      {saindo ? "Saindo..." : "Sair"}
    </button>
  );
}
