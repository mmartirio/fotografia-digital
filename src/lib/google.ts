/**
 * Validação dos identificadores do Google configurados no painel.
 * Só valores no formato esperado chegam ao HTML (evita injetar código por esses campos).
 */
export function idAnalyticsValido(id: string | undefined | null): string | null {
  const v = (id ?? "").trim().toUpperCase();
  return /^G-[A-Z0-9]{4,15}$/.test(v) ? v : null;
}

export function verificacaoGoogleValida(codigo: string | undefined | null): string | null {
  // aceita o valor puro ou a meta tag inteira colada por engano
  const bruto = (codigo ?? "").trim();
  const v = bruto.match(/content=["']([^"']+)["']/)?.[1] ?? bruto;
  return /^[A-Za-z0-9_-]{10,100}$/.test(v) ? v : null;
}
