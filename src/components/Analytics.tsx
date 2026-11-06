"use client";

import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect, useState } from "react";

const CHAVE = "consentimento-analytics";
type Escolha = "aceito" | "recusado" | null;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Reabre o banner (link "Cookies" no rodapé). */
export function abrirPreferenciasCookies() {
  window.dispatchEvent(new Event("preferencias-cookies"));
}

/**
 * Google Analytics 4 com consentimento (LGPD):
 * - nada do Google é carregado antes do visitante aceitar;
 * - o painel do fotógrafo nunca é medido;
 * - envia ao Analytics as métricas reais de velocidade (Core Web Vitals: LCP, INP, CLS…),
 *   as mesmas que o PageSpeed usa em "dados de usuários reais".
 */
export function Analytics({ idMedicao }: { idMedicao: string | null }) {
  const caminho = usePathname();
  const [escolha, setEscolha] = useState<Escolha>(null);
  const [carregado, setCarregado] = useState(false);
  const [bannerAberto, setBannerAberto] = useState(false);
  const noPainel = caminho.startsWith("/painel");

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE) as Escolha;
    setEscolha(salvo);
    setCarregado(true);
    const abrir = () => setBannerAberto(true);
    window.addEventListener("preferencias-cookies", abrir);
    return () => window.removeEventListener("preferencias-cookies", abrir);
  }, []);

  useReportWebVitals((m) => {
    window.gtag?.("event", m.name, {
      value: Math.round(m.name === "CLS" ? m.value * 1000 : m.value),
      metric_id: m.id,
      metric_value: m.value,
      metric_delta: m.delta,
      metric_rating: m.rating,
      non_interaction: true,
    });
  });

  function decidir(valor: "aceito" | "recusado") {
    localStorage.setItem(CHAVE, valor);
    setEscolha(valor);
    setBannerAberto(false);
    // recusou depois de ter aceitado: desliga a coleta já carregada nesta visita
    if (valor === "recusado" && idMedicao) (window as unknown as Record<string, boolean>)[`ga-disable-${idMedicao}`] = true;
  }

  if (!idMedicao || noPainel) return null;
  const mostrarBanner = carregado && (escolha === null || bannerAberto);

  return (
    <>
      {escolha === "aceito" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${idMedicao}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${idMedicao}');`}
          </Script>
        </>
      )}

      {mostrarBanner && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Preferências de cookies"
          className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-xl rounded-2xl bg-white p-5 text-sm shadow-2xl ring-1 ring-black/10 sm:bottom-5"
        >
          <p className="font-medium text-grafite">Cookies de estatística</p>
          <p className="mt-1 text-texto-suave">
            Usamos o Google Analytics para entender as visitas e melhorar o site. Ele só é ativado se você permitir. Os cookies
            essenciais (como o acesso à área do cliente) funcionam sempre.{" "}
            <Link href="/#rodape" className="underline">
              Saiba mais
            </Link>
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => decidir("recusado")} className="botao-secundario min-h-11">
              Recusar
            </button>
            <button type="button" onClick={() => decidir("aceito")} className="botao-primario min-h-11">
              Aceitar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
