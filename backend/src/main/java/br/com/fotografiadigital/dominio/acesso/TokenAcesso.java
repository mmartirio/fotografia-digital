package br.com.fotografiadigital.dominio.acesso;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Link mágico: uso único, curta duração. Só o hash SHA-256 do token é persistido. */
@Entity
@Table(name = "token_acesso")
public class TokenAcesso {

    @Id
    private UUID id;

    @Column(name = "cliente_id", nullable = false)
    private UUID clienteId;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;

    @Column(name = "usado_em")
    private Instant usadoEm;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected TokenAcesso() {
        // JPA
    }

    public TokenAcesso(UUID clienteId, String tokenHash, Instant expiraEm, Instant agora) {
        this.id = UUID.randomUUID();
        this.clienteId = clienteId;
        this.tokenHash = tokenHash;
        this.expiraEm = expiraEm;
        this.criadoEm = agora;
    }

    public boolean utilizavel(Instant agora) {
        return usadoEm == null && agora.isBefore(expiraEm);
    }

    public void usar(Instant agora) {
        this.usadoEm = agora;
    }

    public UUID getClienteId() { return clienteId; }
}
