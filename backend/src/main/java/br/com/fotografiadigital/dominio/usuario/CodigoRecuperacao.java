package br.com.fotografiadigital.dominio.usuario;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Código de recuperação do 2FA (uso único). Só o hash é guardado. */
@Entity
@Table(name = "codigo_recuperacao")
public class CodigoRecuperacao {

    @Id
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "codigo_hash", nullable = false)
    private String codigoHash;

    @Column(name = "usado_em")
    private Instant usadoEm;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected CodigoRecuperacao() {
        // JPA
    }

    public CodigoRecuperacao(UUID usuarioId, String codigoHash, Instant agora) {
        this.id = UUID.randomUUID();
        this.usuarioId = usuarioId;
        this.codigoHash = codigoHash;
        this.criadoEm = agora;
    }

    public boolean disponivel() {
        return usadoEm == null;
    }

    public void usar(Instant agora) {
        this.usadoEm = agora;
    }
}
