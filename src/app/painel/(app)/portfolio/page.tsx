import { redirect } from "next/navigation";

/** O portfólio agora fica na tela Imagens. */
export default function PortfolioPagina() {
  redirect("/painel/imagens#portfolio");
}
