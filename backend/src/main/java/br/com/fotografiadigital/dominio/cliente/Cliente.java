package br.com.fotografiadigital.dominio.cliente;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cliente")
public class Cliente {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    private String telefone;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected Cliente() {
        // JPA
    }

    public Cliente(String nome, String email, String telefone, Instant agora) {
        this.id = UUID.randomUUID();
        this.nome = nome.trim();
        this.email = email.trim().toLowerCase();
        this.telefone = telefone;
        this.criadoEm = agora;
    }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public Instant getCriadoEm() { return criadoEm; }
}
