-- Verificação em duas etapas (TOTP) do painel

-- Segredos ficam CIFRADOS (AES-GCM, chave fora do banco)
ALTER TABLE usuario ADD COLUMN totp_segredo      VARCHAR(255);        -- ativo
ALTER TABLE usuario ADD COLUMN totp_pendente     VARCHAR(255);        -- em configuração (ainda não confirmado)
ALTER TABLE usuario ADD COLUMN totp_ativo        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuario ADD COLUMN totp_ultimo_passo BIGINT;              -- anti-replay: último passo de 30 s aceito

-- Códigos de recuperação (uso único). Só o hash SHA-256 é guardado.
CREATE TABLE codigo_recuperacao (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   UUID        NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    codigo_hash  VARCHAR(64) NOT NULL,
    usado_em     TIMESTAMPTZ,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (usuario_id, codigo_hash)
);
