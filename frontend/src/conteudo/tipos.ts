/**
 * Estrutura do conteúdo editável da landing. Na Fase 4 estes dados passam a
 * vir do painel gestor (tabela conteudo_secao); o nav não é editável.
 */

export type Foto = {
  src: string;
  largura: number;
  altura: number;
  alt: string;
};

export type FotoPortfolio = Foto & { categoria: string };

export type Cta = { texto: string; href: string };

export type ConteudoSite = {
  marca: string;
  slogan: string;
  aparencia: {
    logo: string; // caminho da imagem (PNG com transparência)
    nomeLogo: string; // "|" separa as partes coloridas, ex.: DAVI|FOTO|VIDEO
    coresNome: string[]; // uma cor (#hex) por parte do nome
    fonteTitulos: string; // slug de FONTES
    fonteTexto: string;
  };
  hero: {
    etiqueta: string;
    titulo: string;
    subtitulo: string;
    ctaPrimario: Cta;
    ctaSecundario: Cta;
    imagem: Foto;
  };
  sobre: {
    etiqueta: string;
    titulo: string;
    paragrafos: string[];
    imagem: Foto;
    numeros: { valor: string; rotulo: string }[];
  };
  portfolio: {
    etiqueta: string;
    titulo: string;
    subtitulo: string;
    categorias: { slug: string; nome: string }[];
    fotos: FotoPortfolio[];
  };
  servicos: {
    etiqueta: string;
    titulo: string;
    subtitulo: string;
    itens: {
      nome: string;
      descricao: string;
      preco: string;
      inclui: string[];
      destaque?: boolean;
    }[];
    observacao: string;
  };
  comoFunciona: {
    etiqueta: string;
    titulo: string;
    passos: { titulo: string; descricao: string }[];
  };
  depoimentos: {
    etiqueta: string;
    titulo: string;
    itens: { texto: string; nome: string; ensaio: string }[];
  };
  faq: {
    etiqueta: string;
    titulo: string;
    itens: { pergunta: string; resposta: string }[];
  };
  orcamento: {
    etiqueta: string;
    titulo: string;
    subtitulo: string;
  };
  ctaFinal: {
    titulo: string;
    subtitulo: string;
    botao: string;
    imagem: Foto;
  };
  // Canais do fotógrafo: somente WhatsApp e Instagram
  contato: {
    whatsapp: string; // somente dígitos, com DDI: 55 + DDD + número
    mensagemWhatsapp: string;
    instagram: string; // sem @
    cidade: string;
  };
  rodape: {
    atendimento: string; // linha abaixo do slogan
    direitos: string; // depois de "© ano Nome."
    mostrarAreaCliente: boolean;
  };
  seo: {
    titulo: string;
    descricao: string;
    imagemOg: string;
  };
};
