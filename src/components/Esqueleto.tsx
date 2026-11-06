/**
 * Esqueleto de carregamento: aparece instantaneamente ao clicar num link
 * enquanto a próxima tela é preparada no servidor (feedback imediato).
 */
export function EsqueletoPagina({ variante = "grade" }: { variante?: "grade" | "lista" | "formulario" }) {
  const bloco = "animate-pulse rounded-2xl bg-black/[0.06]";
  return (
    <div className="mx-auto w-full max-w-6xl" aria-busy="true" aria-label="Carregando">
      <div className={`${bloco} h-9 w-56`} />
      <div className={`${bloco} mt-3 h-4 w-80 max-w-full`} />
      {variante === "grade" && (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={`${bloco} aspect-square`} />
          ))}
        </div>
      )}
      {variante === "lista" && (
        <div className="mt-8 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`${bloco} h-20`} />
          ))}
        </div>
      )}
      {variante === "formulario" && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className={`${bloco} hidden h-96 lg:block`} />
          <div className={`${bloco} h-[32rem]`} />
        </div>
      )}
    </div>
  );
}
