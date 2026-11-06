package br.com.fotografiadigital.dominio.conteudo;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Uma seção do site (hero, sobre, contato, seo...) com seu conteúdo em JSON. */
@Entity
@Table(name = "conteudo_secao")
public class ConteudoSecao {

    @Id
    private String chave;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String conteudo;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected ConteudoSecao() {
        // JPA
    }

    public ConteudoSecao(String chave, String conteudo, Instant agora) {
        this.chave = chave;
        this.conteudo = conteudo;
        this.atualizadoEm = agora;
    }

    public void atualizar(String conteudo, Instant agora) {
        this.conteudo = conteudo;
        this.atualizadoEm = agora;
    }

    public String getChave() { return chave; }
    public String getConteudo() { return conteudo; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
}
