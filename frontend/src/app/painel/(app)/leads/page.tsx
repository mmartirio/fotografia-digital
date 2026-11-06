import type { Metadata } from "next";
import { ListaLeads, type LeadDto } from "@/components/painel/ListaLeads";
import { apiServidor } from "@/lib/api-servidor";

export const metadata: Metadata = { title: "Orçamentos" };

export default async function LeadsPainel() {
  const { dados } = await apiServidor<LeadDto[]>("/api/painel/leads");
  return <ListaLeads leads={dados ?? []} />;
}
