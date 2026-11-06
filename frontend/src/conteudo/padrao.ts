import type { ConteudoSite, FotoPortfolio } from "./tipos";

/**
 * Conteúdo inicial do site do DAVIFOTOVIDEO.
 * - Dados do fotógrafo: Instagram @davifotovideo e bio.site/DAVIFOTOVIDEO.
 * - Fotos: EXEMPLOS CC0 em /public/exemplos (ver CREDITOS.md) até o Davi
 *   subir o portfólio dele pelo painel (Fase 4).
 * - Depoimentos: EXEMPLOS; substituir por depoimentos reais antes de publicar.
 */

const H = 640; // altura das fotos horizontais de exemplo
const V = 1440; // altura das fotos verticais de exemplo

function foto(arquivo: string, alt: string, categoria: string, vertical = false): FotoPortfolio {
  return { src: `/exemplos/${arquivo}.jpg`, largura: 960, altura: vertical ? V : H, alt, categoria };
}

export const conteudoPadrao: ConteudoSite = {
  marca: "Davi Foto Vídeo",
  slogan: "Registrando momentos",

  aparencia: {
    logo: "/marca/icone.png",
    nomeLogo: "DAVI|FOTO|VIDEO",
    coresNome: ["#38383f", "#3070b8", "#48a8e0"],
    fonteTitulos: "playfair",
    fonteTexto: "roboto",
  },

  hero: {
    etiqueta: "Foto & vídeo · Sergipe",
    titulo: "Registrando momentos",
    subtitulo:
      "Casamentos, ensaios, aniversários e estúdio. Em todo o estado de Sergipe.",
    ctaPrimario: { texto: "Solicitar orçamento", href: "#orcamento" },
    ctaSecundario: { texto: "Ver portfólio", href: "#portfolio" },
    imagem: {
      src: "/exemplos/casamento-por-do-sol.jpg",
      largura: 960,
      altura: H,
      alt: "Casal de noivos abraçados à beira de um lago ao pôr do sol",
    },
  },

  sobre: {
    etiqueta: "Sobre",
    titulo: "Prazer, eu sou o Davi",
    paragrafos: [
      "Desde 2018 eu registro momentos: casamentos, ensaios, aniversários e sessões em estúdio, sempre em foto e vídeo.",
      "Atendo em todo o estado de Sergipe. Cada trabalho é pensado junto com você, para que no dia a única preocupação seja viver o momento.",
    ],
    imagem: {
      src: "/exemplos/fotografo-retrato.jpg",
      largura: 960,
      altura: H,
      alt: "Fotógrafo refletido no retrovisor de um carro segurando a câmera",
    },
    numeros: [
      { valor: "Desde 2018", rotulo: "Registrando casamentos, ensaios e eventos" },
      { valor: "Foto e vídeo", rotulo: "Os dois com o mesmo profissional, do início ao fim" },
    ],
  },

  portfolio: {
    etiqueta: "Portfólio",
    titulo: "Momentos registrados",
    subtitulo: "Casamentos, ensaios e histórias em família.",
    categorias: [
      { slug: "casamentos", nome: "Casamentos" },
      { slug: "ensaios", nome: "Ensaios" },
      { slug: "gestante", nome: "Gestante & Newborn" },
      { slug: "familia", nome: "Família" },
    ],
    fotos: [
      foto("casamento-beijo-pb", "Noivos se beijando em preto e branco", "casamentos"),
      foto("ensaio-casal-chuva-pb", "Casal se beijando sob guarda-chuva transparente na chuva", "ensaios", true),
      foto("familia-piquenique", "Família sorridente deitada na grama com o cachorro", "familia"),
      foto("casamento-alianca", "Noivo colocando a aliança na noiva", "casamentos"),
      foto("gestante-vestido-branco", "Gestante de vestido branco segurando a barriga", "gestante", true),
      foto("ensaio-casal-outono", "Casal se beijando entre folhas de outono", "ensaios"),
      foto("casamento-buque-noiva", "Noiva segurando buquê de rosas brancas", "casamentos", true),
      foto("familia-abraco-outono", "Mãe abraçando o filho em trilha de outono", "familia"),
      foto("ensaio-retrato-feminino", "Retrato de mulher de cabelos cacheados", "ensaios"),
      foto("casamento-maos-buque", "Mãos dos noivos com alianças sobre o buquê", "casamentos"),
      foto("familia-mae-bebe", "Mãe brincando com a filha bebê no quarto", "gestante", true),
      foto("ensaio-casal-campo", "Casal abraçado em campo dourado ao entardecer", "ensaios"),
      foto("casamento-maos-dadas", "Noivos de mãos dadas com sombras no gramado", "casamentos"),
      foto("ensaio-retrato-praia", "Mulher de vestido longo à beira-mar", "ensaios", true),
      foto("gestante-silhueta", "Silhueta de gestante contra a luz da janela", "gestante"),
      foto("familia-irmas-lago", "Duas irmãs sentadas à beira de um lago", "familia"),
      foto("casamento-campo", "Noivos sentados em um banco no campo", "casamentos"),
      foto("ensaio-casal-silhueta", "Silhueta de casal de mãos dadas ao pôr do sol", "ensaios", true),
      foto("familia-mae-filhos", "Mãe abraçando os dois filhos em casa", "familia", true),
      foto("casamento-aliancas-detalhe", "Alianças de casamento sobre uma suculenta", "casamentos"),
    ],
  },

  servicos: {
    etiqueta: "Serviços",
    titulo: "Como posso registrar o seu momento",
    subtitulo: "Cada orçamento é montado sob medida. Escolha o serviço e me conte a sua ideia.",
    itens: [
      {
        nome: "Casamentos",
        descricao: "Do making of à festa, em foto e vídeo.",
        preco: "Sob consulta",
        inclui: ["Cobertura em foto e vídeo", "Making of, cerimônia e festa", "Seleção online das fotos", "Entrega digital em alta resolução"],
      },
      {
        nome: "Ensaios",
        descricao: "Casal, gestante, família, newborn ou individual.",
        preco: "Sob consulta",
        inclui: ["Locação externa ou estúdio", "Direção de poses leve", "Seleção online das fotos", "Entrega digital em alta resolução"],
        destaque: true,
      },
      {
        nome: "Aniversários",
        descricao: "Festas infantis, 15 anos e comemorações.",
        preco: "Sob consulta",
        inclui: ["Cobertura do evento", "Detalhes, decoração e convidados", "Opção de vídeo", "Entrega digital em alta resolução"],
      },
      {
        nome: "Foto Estúdio",
        descricao: "Retratos, books e fotos profissionais.",
        preco: "Sob consulta",
        inclui: ["Estúdio com iluminação profissional", "Fundo e cenário à escolha", "Seleção online das fotos", "Entrega digital em alta resolução"],
      },
    ],
    observacao: "Fotos extras além do pacote podem ser escolhidas na seleção e combinadas à parte.",
  },

  comoFunciona: {
    etiqueta: "Como funciona",
    titulo: "Do primeiro contato à entrega",
    passos: [
      { titulo: "Conversa", descricao: "Você me conta a sua ideia e montamos juntos a data e o pacote." },
      { titulo: "O grande dia", descricao: "Eu cuido do registro em foto e vídeo para você só aproveitar." },
      { titulo: "Seleção online", descricao: "Você recebe um link e escolhe as favoritas na área do cliente." },
      { titulo: "Entrega", descricao: "As fotos tratadas ficam disponíveis para download por 60 dias." },
    ],
  },

  depoimentos: {
    etiqueta: "Depoimentos",
    titulo: "Quem já viveu essa experiência",
    // EXEMPLOS: substituir por depoimentos reais dos clientes antes de publicar
    itens: [
      {
        texto: "Espaço para o depoimento de um casal. Os textos reais serão cadastrados pelo painel.",
        nome: "Depoimento de exemplo",
        ensaio: "Casamento",
      },
      {
        texto: "Espaço para o depoimento de uma cliente de ensaio. Os textos reais serão cadastrados pelo painel.",
        nome: "Depoimento de exemplo",
        ensaio: "Ensaio",
      },
      {
        texto: "Espaço para o depoimento de uma família. Os textos reais serão cadastrados pelo painel.",
        nome: "Depoimento de exemplo",
        ensaio: "Aniversário",
      },
    ],
  },

  faq: {
    etiqueta: "Dúvidas",
    titulo: "Perguntas frequentes",
    itens: [
      {
        pergunta: "Como reservo uma data?",
        resposta: "Preencha o formulário de orçamento ou me chame no WhatsApp. Combinamos os detalhes e a data fica reservada.",
      },
      {
        pergunta: "Vocês fazem foto e vídeo?",
        resposta: "Sim! Trabalho com foto e vídeo, e você pode contratar os dois juntos ou separados.",
      },
      {
        pergunta: "Como escolho as fotos?",
        resposta: "Depois do ensaio você recebe por e-mail o acesso à área do cliente, onde vê todas as fotos e marca suas favoritas.",
      },
      {
        pergunta: "Por quanto tempo as fotos ficam disponíveis?",
        resposta: "As fotos finais ficam na área do cliente por 60 dias após a entrega. Depois disso são excluídas, então faça o download e guarde um backup.",
      },
      {
        pergunta: "Posso escolher fotos além do pacote?",
        resposta: "Pode. Na seleção você marca as extras e combinamos o valor diretamente.",
      },
      {
        pergunta: "Quais cidades você atende?",
        resposta: "Atendo em todo o estado de Sergipe, de Aracaju ao interior. Me chame no WhatsApp para confirmar a disponibilidade na sua cidade.",
      },
    ],
  },

  orcamento: {
    etiqueta: "Orçamento",
    titulo: "Vamos registrar o seu momento?",
    subtitulo: "Me chame no WhatsApp e me conte sobre o que você imagina. Respondo o quanto antes.",
  },

  ctaFinal: {
    titulo: "Sua história merece ser registrada",
    subtitulo: "Agenda aberta em todo o estado de Sergipe.",
    botao: "Falar no WhatsApp",
    imagem: {
      src: "/exemplos/ensaio-casal-campo.jpg",
      largura: 960,
      altura: H,
      alt: "Casal abraçado em campo dourado ao entardecer",
    },
  },

  contato: {
    // Fonte: bio.site/DAVIFOTOVIDEO
    whatsapp: "5579998926980",
    mensagemWhatsapp: "Olá, Davi! Vi seu site e gostaria de um orçamento.",
    instagram: "davifotovideo",
    cidade: "Atendimento em todo o estado de Sergipe",
  },

  rodape: {
    atendimento: "Atendimento em todo o estado de Sergipe",
    direitos: "Todos os direitos reservados.",
    mostrarAreaCliente: true,
  },

  seo: {
    titulo: "Davi Foto Vídeo | Fotografia e vídeo de casamentos e ensaios em Sergipe",
    descricao:
      "DAVIFOTOVIDEO: registrando momentos desde 2018. Fotografia e vídeo de casamentos, ensaios, aniversários e estúdio com atendimento em todo o estado de Sergipe.",
    imagemOg: "/exemplos/casamento-por-do-sol.jpg",
  },
};
