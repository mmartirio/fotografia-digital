package br.com.fotografiadigital.dominio.lead;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Pedido de orçamento vindo do formulário da landing.
 */
@Entity
@Table(name = "lead")
public class Lead {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nome;

    private String email;

    private String telefone;

    @Column(name = "tipo_ensaio")
    private String tipoEnsaio;

    @Column(name = "data_desejada")
    private LocalDate dataDesejada;

    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusLead status;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected Lead() {
        // JPA
    }

    public Lead(String nome, String email, String telefone, String tipoEnsaio, LocalDate dataDesejada, String mensagem) {
        this.id = UUID.randomUUID();
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.tipoEnsaio = tipoEnsaio;
        this.dataDesejada = dataDesejada;
        this.mensagem = mensagem;
        this.status = StatusLead.NOVO;
        this.criadoEm = Instant.now();
        this.atualizadoEm = this.criadoEm;
    }

    public void mudarStatus(StatusLead novo) {
        this.status = novo;
        this.atualizadoEm = Instant.now();
    }

    @PreUpdate
    void aoAtualizar() {
        this.atualizadoEm = Instant.now();
    }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public String getTipoEnsaio() { return tipoEnsaio; }
    public LocalDate getDataDesejada() { return dataDesejada; }
    public String getMensagem() { return mensagem; }
    public StatusLead getStatus() { return status; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
}
