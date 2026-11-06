-- Área do cliente e painel gestor

-- Miniatura (~600px) para as grades; a prévia (~1600px) leva marca d'água
ALTER TABLE foto_galeria ADD COLUMN arquivo_miniatura VARCHAR(300);

-- Sessões (cookie httpOnly guarda o token opaco; aqui só o hash SHA-256).
-- tipo CLIENTE: sujeito = cliente.id (link mágico) | ADMIN: sujeito = usuario.id (painel)
CREATE TABLE sessao (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo        VARCHAR(10) NOT NULL CHECK (tipo IN ('CLIENTE', 'ADMIN')),
    sujeito_id  UUID        NOT NULL,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_sessao_expira ON sessao (expira_em);
CREATE INDEX ix_token_acesso_criado ON token_acesso (cliente_id, criado_em);

-- Conteúdo do site: tudo (inclusive contato, SEO e lista de categorias) vive em
-- conteudo_secao como JSON por seção, editado pelo painel.
DROP TABLE config_contato;
DROP TABLE config_seo;

-- Portfólio: categoria passa a ser o slug definido na seção "portfolio"
ALTER TABLE foto_portfolio DROP COLUMN categoria_id;
DROP TABLE categoria;
ALTER TABLE foto_portfolio ADD COLUMN categoria VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE foto_portfolio ADD COLUMN arquivo_miniatura VARCHAR(300);
CREATE INDEX ix_foto_portfolio_ordem ON foto_portfolio (ordem, criado_em);
