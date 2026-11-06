"use client";

import { abrirPreferenciasCookies } from "./Analytics";

/** Reabre o banner de consentimento (o visitante pode mudar a escolha a qualquer momento). */
export function BotaoCookies() {
  return (
    <button type="button" onClick={abrirPreferenciasCookies} className="hover:text-agua">
      Cookies
    </button>
  );
}
