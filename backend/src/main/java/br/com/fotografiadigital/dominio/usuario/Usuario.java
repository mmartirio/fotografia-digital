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

    // ---- verificação em duas etapas (segredos cifrados pelo Cifrador) ----

    @Column(name = "totp_segredo")
    private String totpSegredo;

    @Column(name = "totp_pendente")
    private String totpPendente;

    @Column(name = "totp_ativo", nullable = false)
    private boolean totpAtivo;

    @Column(name = "totp_ultimo_passo")
    private Long totpUltimoPasso;

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

    /** Guarda um segredo novo ainda não confirmado (não vale para o login até ativar). */
    public void iniciarDoisFatores(String segredoCifrado) {
        this.totpPendente = segredoCifrado;
    }

    /** Confirma o segredo pendente após o primeiro código correto. */
    public void ativarDoisFatores(long passoUsado) {
        this.totpSegredo = this.totpPendente;
        this.totpPendente = null;
        this.totpAtivo = true;
        this.totpUltimoPasso = passoUsado;
    }

    public void desativarDoisFatores() {
        this.totpSegredo = null;
        this.totpPendente = null;
        this.totpAtivo = false;
        this.totpUltimoPasso = null;
    }

    /** Anti-replay: um código só pode ser usado uma vez. */
    public void registrarPassoUsado(long passo) {
        this.totpUltimoPasso = passo;
    }

    public boolean isTotpAtivo() { return totpAtivo; }
    public String getTotpSegredo() { return totpSegredo; }
    public String getTotpPendente() { return totpPendente; }
    public Long getTotpUltimoPasso() { return totpUltimoPasso; }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getSenhaHash() { return senhaHash; }
    public boolean isAtivo() { return ativo; }
}
