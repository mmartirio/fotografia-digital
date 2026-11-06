-- Schema inicial: Fotografia Digital
-- Fotos ficam no disco (volume); aqui só metadados.

-- ---------------------------------------------------------------------------
-- Usuários do painel (fotógrafo)
-- ---------------------------------------------------------------------------
CREATE TABLE usuario (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(180) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    papel       VARCHAR(20)  NOT NULL DEFAULT 'ADMIN' CHECK (papel IN ('ADMIN')),
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Conteúdo editável do site (todas as seções, exceto o nav)
-- chave: hero, sobre, servicos, como-funciona, depoimentos, faq, cta, rodape...
-- ---------------------------------------------------------------------------
CREATE TABLE conteudo_secao (
    chave          VARCHAR(60) PRIMARY KEY,
    conteudo       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Linha única (id = 1)
CREATE TABLE config_contato (
    id                 SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    whatsapp           VARCHAR(20),
    mensagem_whatsapp  VARCHAR(500),
    instagram          VARCHAR(120),
    email              VARCHAR(180),
    telefone           VARCHAR(20),
    cidade             VARCHAR(120),
    atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Linha única (id = 1)
CREATE TABLE config_seo (
    id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    titulo          VARCHAR(70),
    descricao       VARCHAR(170),
    palavras_chave  VARCHAR(300),
    imagem_og       VARCHAR(300),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO config_contato (id) VALUES (1);
INSERT INTO config_seo (id) VALUES (1);

-- ---------------------------------------------------------------------------
-- Portfólio público
-- ---------------------------------------------------------------------------
CREATE TABLE categoria (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome   VARCHAR(80) NOT NULL,
    slug   VARCHAR(80) NOT NULL UNIQUE,
    ordem  INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE foto_portfolio (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id  UUID         REFERENCES categoria (id) ON DELETE SET NULL,
    arquivo       VARCHAR(300) NOT NULL,
    largura       INTEGER      NOT NULL,
    altura        INTEGER      NOT NULL,
    alt           VARCHAR(200) NOT NULL,
    destaque      BOOLEAN      NOT NULL DEFAULT FALSE,
    ordem         INTEGER      NOT NULL DEFAULT 0,
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_foto_portfolio_categoria ON foto_portfolio (categoria_id, ordem);

-- ---------------------------------------------------------------------------
-- Clientes e galerias
-- ---------------------------------------------------------------------------
CREATE TABLE cliente (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome       VARCHAR(120) NOT NULL,
    email      VARCHAR(180) NOT NULL UNIQUE,
    telefone   VARCHAR(20),
    criado_em  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Link mágico: guarda só o hash do token
CREATE TABLE token_acesso (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id  UUID        NOT NULL REFERENCES cliente (id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ NOT NULL,
    usado_em    TIMESTAMPTZ,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_token_acesso_cliente ON token_acesso (cliente_id);

CREATE TABLE galeria (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id         UUID         NOT NULL REFERENCES cliente (id) ON DELETE RESTRICT,
    titulo             VARCHAR(150) NOT NULL,
    status             VARCHAR(30)  NOT NULL DEFAULT 'CRIADA'
                       CHECK (status IN ('CRIADA', 'AGUARDANDO_SELECAO', 'SELECAO_ENVIADA',
                                         'EM_TRATAMENTO', 'ENTREGUE', 'EXPIRADA')),
    limite_fotos       INTEGER      CHECK (limite_fotos IS NULL OR limite_fotos > 0),
    observacao_cliente TEXT,
    selecao_enviada_em TIMESTAMPTZ,
    entregue_em        TIMESTAMPTZ,
    expira_em          TIMESTAMPTZ,
    arquivos_excluidos_em TIMESTAMPTZ,
    criado_em          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_galeria_cliente ON galeria (cliente_id);
CREATE INDEX ix_galeria_expiracao ON galeria (expira_em) WHERE status = 'ENTREGUE';

CREATE TABLE foto_galeria (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    galeria_id      UUID         NOT NULL REFERENCES galeria (id) ON DELETE CASCADE,
    tipo            VARCHAR(10)  NOT NULL CHECK (tipo IN ('ORIGINAL', 'FINAL')),
    nome_original   VARCHAR(255) NOT NULL,
    arquivo         VARCHAR(300) NOT NULL,
    arquivo_previa  VARCHAR(300),
    tamanho_bytes   BIGINT       NOT NULL,
    largura         INTEGER,
    altura          INTEGER,
    selecionada     BOOLEAN      NOT NULL DEFAULT FALSE,
    comentario      VARCHAR(500),
    ordem           INTEGER      NOT NULL DEFAULT 0,
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_foto_galeria_galeria ON foto_galeria (galeria_id, tipo, ordem);

-- ---------------------------------------------------------------------------
-- Leads (formulário de orçamento)
-- ---------------------------------------------------------------------------
CREATE TABLE lead (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome           VARCHAR(120) NOT NULL,
    email          VARCHAR(180),
    telefone       VARCHAR(20),
    tipo_ensaio    VARCHAR(80),
    data_desejada  DATE,
    mensagem       VARCHAR(1000),
    status         VARCHAR(20)  NOT NULL DEFAULT 'NOVO'
                   CHECK (status IN ('NOVO', 'EM_CONTATO', 'FECHADO', 'PERDIDO')),
    criado_em      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CHECK (email IS NOT NULL OR telefone IS NOT NULL)
);
CREATE INDEX ix_lead_status ON lead (status, criado_em DESC);

-- ---------------------------------------------------------------------------
-- Log de e-mails enviados (acesso, entrega, avisos de expiração)
-- ---------------------------------------------------------------------------
CREATE TABLE notificacao_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    galeria_id    UUID         REFERENCES galeria (id) ON DELETE SET NULL,
    tipo          VARCHAR(40)  NOT NULL,
    destinatario  VARCHAR(180) NOT NULL,
    sucesso       BOOLEAN      NOT NULL,
    erro          VARCHAR(1000),
    enviado_em    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- Evita aviso duplicado (ex.: AVISO_D7 da mesma galeria)
CREATE UNIQUE INDEX ux_notificacao_galeria_tipo ON notificacao_log (galeria_id, tipo)
    WHERE sucesso AND galeria_id IS NOT NULL;
