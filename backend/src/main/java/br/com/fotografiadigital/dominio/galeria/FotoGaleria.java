package br.com.fotografiadigital.dominio.galeria;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Metadados de uma foto da galeria. Caminhos são relativos à raiz do armazenamento.
 */
@Entity
@Table(name = "foto_galeria")
public class FotoGaleria {

    @Id
    private UUID id;

    @Column(name = "galeria_id", nullable = false)
    private UUID galeriaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoFoto tipo;

    @Column(name = "nome_original", nullable = false)
    private String nomeOriginal;

    @Column(nullable = false)
    private String arquivo;

    @Column(name = "arquivo_previa")
    private String arquivoPrevia;

    @Column(name = "arquivo_miniatura")
    private String arquivoMiniatura;

    @Column(name = "tamanho_bytes", nullable = false)
    private long tamanhoBytes;

    private Integer largura;

    private Integer altura;

    @Column(nullable = false)
    private boolean selecionada;

    private String comentario;

    @Column(nullable = false)
    private int ordem;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected FotoGaleria() {
        // JPA
    }

    public FotoGaleria(UUID id, UUID galeriaId, TipoFoto tipo, String nomeOriginal, String arquivo, String arquivoPrevia,
            String arquivoMiniatura, long tamanhoBytes, int largura, int altura, int ordem, Instant agora) {
        this.id = id;
        this.galeriaId = galeriaId;
        this.tipo = tipo;
        this.nomeOriginal = nomeOriginal;
        this.arquivo = arquivo;
        this.arquivoPrevia = arquivoPrevia;
        this.arquivoMiniatura = arquivoMiniatura;
        this.tamanhoBytes = tamanhoBytes;
        this.largura = largura;
        this.altura = altura;
        this.ordem = ordem;
        this.criadoEm = agora;
    }

    public void marcar(boolean selecionada, String comentario) {
        this.selecionada = selecionada;
        this.comentario = comentario == null || comentario.isBlank() ? null : comentario.trim();
    }

    public UUID getId() { return id; }
    public UUID getGaleriaId() { return galeriaId; }
    public TipoFoto getTipo() { return tipo; }
    public String getNomeOriginal() { return nomeOriginal; }
    public String getArquivo() { return arquivo; }
    public String getArquivoPrevia() { return arquivoPrevia; }
    public String getArquivoMiniatura() { return arquivoMiniatura; }
    public long getTamanhoBytes() { return tamanhoBytes; }
    public Integer getLargura() { return largura; }
    public Integer getAltura() { return altura; }
    public boolean isSelecionada() { return selecionada; }
    public String getComentario() { return comentario; }
    public int getOrdem() { return ordem; }
}
