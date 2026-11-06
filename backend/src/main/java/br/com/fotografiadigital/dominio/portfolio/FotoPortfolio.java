package br.com.fotografiadigital.dominio.portfolio;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "foto_portfolio")
public class FotoPortfolio {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String categoria;

    @Column(nullable = false)
    private String arquivo;

    @Column(name = "arquivo_miniatura")
    private String arquivoMiniatura;

    @Column(nullable = false)
    private int largura;

    @Column(nullable = false)
    private int altura;

    @Column(nullable = false)
    private String alt;

    @Column(nullable = false)
    private boolean destaque;

    @Column(nullable = false)
    private int ordem;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected FotoPortfolio() {
        // JPA
    }

    public FotoPortfolio(UUID id, String categoria, String arquivo, String arquivoMiniatura, int largura, int altura,
            String alt, int ordem, Instant agora) {
        this.id = id;
        this.categoria = categoria;
        this.arquivo = arquivo;
        this.arquivoMiniatura = arquivoMiniatura;
        this.largura = largura;
        this.altura = altura;
        this.alt = alt;
        this.ordem = ordem;
        this.criadoEm = agora;
    }

    public void editar(String categoria, String alt, boolean destaque) {
        this.categoria = categoria;
        this.alt = alt;
        this.destaque = destaque;
    }

    public void ordenar(int ordem) {
        this.ordem = ordem;
    }

    public UUID getId() { return id; }
    public String getCategoria() { return categoria; }
    public String getArquivo() { return arquivo; }
    public String getArquivoMiniatura() { return arquivoMiniatura; }
    public int getLargura() { return largura; }
    public int getAltura() { return altura; }
    public String getAlt() { return alt; }
    public boolean isDestaque() { return destaque; }
    public int getOrdem() { return ordem; }
}
