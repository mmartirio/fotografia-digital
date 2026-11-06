export function linkWhatsapp(numero: string, mensagem?: string): string {
  const digitos = numero.replace(/\D/g, "");
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${digitos}${texto}`;
}

export function linkInstagram(usuario: string): string {
  return `https://instagram.com/${usuario.replace(/^@/, "")}`;
}

export function linkTelefone(telefone: string): string {
  return `tel:+55${telefone.replace(/\D/g, "")}`;
}
