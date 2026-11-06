"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { linkWhatsapp } from "@/lib/contato";
import { formatarData, formatarDataHora } from "@/lib/galeria";
import { IconeEmail, IconeWhatsapp } from "../Icones";

type StatusLead = "NOVO" | "EM_CONTATO" | "FECHADO" | "PERDIDO";
export type LeadDto = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  tipoEnsaio: string | null;
  dataDesejada: string | null;
  mensagem: string | null;
  status: StatusLead;
  criadoEm: string;
};

const ROTULOS: Record<StatusLead, string> = { NOVO: "Novo", EM_CONTATO: "Em contato", FECHADO: "Fechado", PERDIDO: "Perdido" };
const CORES: Record<StatusLead, string> = {
  NOVO: "bg-amber-100 text-amber-800",
  EM_CONTATO: "bg-sky-100 text-sky-800",
  FECHADO: "bg-emerald-100 text-emerald-800",
  PERDIDO: "bg-slate-200 text-slate-600",
};

function whatsappDoCliente(l: LeadDto): string | null {
  if (!l.telefone) return null;
  const digitos = l.telefone.replace(/\D/g, "");
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return linkWhatsapp(numero, `Olá, ${l.nome.split(" ")[0]}! Aqui é o Davi, recebi seu pedido de orçamento${l.tipoEnsaio ? ` para ${l.tipoEnsaio.toLowerCase()}` : ""}.`);
}

export function ListaLeads({ leads: iniciais }: { leads: LeadDto[] }) {
  const [leads, setLeads] = useState(iniciais);
  const [filtro, setFiltro] = useState<StatusLead | "TODOS">("TODOS");
  const lista = filtro === "TODOS" ? leads : leads.filter((l) => l.status === filtro);

  async function mudar(l: LeadDto, status: StatusLead) {
    setLeads((ls) => ls.map((x) => (x.id === l.id ? { ...x, status } : x)));
    try {
      await api(`/api/painel/leads/${l.id}`, { method: "PATCH", json: { status } });
    } catch {
      setLeads((ls) => ls.map((x) => (x.id === l.id ? l : x)));
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl">Pedidos de orçamento</h1>
      <p className="mt-1 text-sm text-texto-suave">Recebidos pelo formulário do site.</p>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {(["TODOS", "NOVO", "EM_CONTATO", "FECHADO", "PERDIDO"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFiltro(s)}
            className={`min-h-10 shrink-0 rounded-full border px-4 text-xs ${filtro === s ? "border-destaque bg-destaque text-white" : "border-borda bg-white text-texto-suave"}`}
          >
            {s === "TODOS" ? `Todos (${leads.length})` : `${ROTULOS[s]} (${leads.filter((l) => l.status === s).length})`}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="mt-10 text-center text-texto-suave">Nenhum pedido aqui.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {lista.map((l) => {
            const wa = whatsappDoCliente(l);
            return (
              <li key={l.id} className="rounded-sm border border-borda bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{l.nome}</p>
                    <p className="text-xs text-texto-suave">
                      {formatarDataHora(l.criadoEm)}
                      {l.tipoEnsaio && ` · ${l.tipoEnsaio}`}
                      {l.dataDesejada && ` · para ${formatarData(l.dataDesejada + "T12:00:00Z")}`}
                    </p>
                  </div>
                  <select
                    value={l.status}
                    onChange={(e) => mudar(l, e.target.value as StatusLead)}
                    className={`min-h-9 rounded-full border-0 px-3 text-xs font-medium ${CORES[l.status]}`}
                    aria-label="Status do pedido"
                  >
                    {Object.entries(ROTULOS).map(([v, r]) => (
                      <option key={v} value={v}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {l.mensagem && <p className="mt-3 whitespace-pre-line text-sm text-texto">{l.mensagem}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="botao-secundario min-h-10 px-4">
                      <IconeWhatsapp className="size-4 text-whatsapp" /> {l.telefone}
                    </a>
                  )}
                  {l.email && (
                    <a href={`mailto:${l.email}`} className="botao-secundario min-h-10 px-4">
                      <IconeEmail className="size-4" /> {l.email}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
