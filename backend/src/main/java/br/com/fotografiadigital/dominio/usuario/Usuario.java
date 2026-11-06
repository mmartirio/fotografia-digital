package br.com.fotografiadigital.dominio.usuario;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Usuário do painel gestor (o fotógrafo). */
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Column(nullable = false)
    private String papel;

    @Column(nullable = false)
    private boolean ativo;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected Usuario() {
        // JPA
    }

    public Usuario(String nome, String email, String senhaHash, Instant agora) {
        this.id = UUID.randomUUID();
        this.nome = nome;
        this.email = email.trim().toLowerCase();
        this.senhaHash = senhaHash;
        this.papel = "ADMIN";
        this.ativo = true;
        this.criadoEm = agora;
    }

    public void trocarSenha(String novoHash) {
        this.senhaHash = novoHash;
    }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getSenhaHash() { return senhaHash; }
    public boolean isAtivo() { return ativo; }
}
