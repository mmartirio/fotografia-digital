package br.com.fotografiadigital.dominio.acesso;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Sessão autenticada (cliente ou admin). Revogável: sair apaga a linha. */
@Entity
@Table(name = "sessao")
public class Sessao {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoSessao tipo;

    @Column(name = "sujeito_id", nullable = false)
    private UUID sujeitoId;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected Sessao() {
        // JPA
    }

    public Sessao(TipoSessao tipo, UUID sujeitoId, String tokenHash, Instant expiraEm, Instant agora) {
        this.id = UUID.randomUUID();
        this.tipo = tipo;
        this.sujeitoId = sujeitoId;
        this.tokenHash = tokenHash;
        this.expiraEm = expiraEm;
        this.criadoEm = agora;
    }

    public boolean valida(Instant agora) {
        return agora.isBefore(expiraEm);
    }

    public TipoSessao getTipo() { return tipo; }
    public UUID getSujeitoId() { return sujeitoId; }
    public Instant getExpiraEm() { return expiraEm; }
}
