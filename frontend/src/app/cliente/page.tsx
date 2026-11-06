import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioAcesso } from "@/components/cliente/FormularioAcesso";
import { obterConteudo } from "@/conteudo/obter";
import { apiServidor } from "@/lib/api-servidor";
import { linkWhatsapp } from "@/lib/contato";

export default async function EntradaCliente() {
  const { status } = await apiServidor("/api/cliente/eu");
  if (status === 200) redirect("/cliente/galerias");

  const { contato } = await obterConteudo();
  return (
    <main className="container-site flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border border-borda bg-white p-6 shadow-sm sm:p-8">
        <p className="etiqueta">Área do cliente</p>
        <h1 className="mt-2 text-3xl">Acesse suas fotos</h1>
        <p className="mt-3 text-sm text-texto-suave">
          Informe o e-mail que você usou na contratação. Enviaremos um link de acesso, sem precisar de senha.
        </p>
        <FormularioAcesso />
      </div>
      <p className="mt-6 text-center text-sm text-texto-suave">
        Problemas para acessar?{" "}
        <a
          href={linkWhatsapp(contato.whatsapp, "Olá, Davi! Preciso de ajuda para acessar minha galeria.")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-destaque underline"
        >
          Fale com o Davi
        </a>
        {" · "}
        <Link href="/" className="underline">
          Voltar ao site
        </Link>
      </p>
    </main>
  );
}
