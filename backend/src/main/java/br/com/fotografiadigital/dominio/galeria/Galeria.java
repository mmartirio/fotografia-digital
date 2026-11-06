package br.com.fotografiadigital.dominio.galeria;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import br.com.fotografiadigital.dominio.RegraNegocioException;

@Entity
@Table(name = "galeria")
public class Galeria {

    @Id
    private UUID id;

    @Column(name = "cliente_id", nullable = false)
    private UUID clienteId;

    @Column(nullable = false)
    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusGaleria status;

    @Column(name = "limite_fotos")
    private Integer limiteFotos;

    @Column(name = "observacao_cliente")
    private String observacaoCliente;

    @Column(name = "selecao_enviada_em")
    private Instant selecaoEnviadaEm;

    @Column(name = "entregue_em")
    private Instant entregueEm;

    @Column(name = "expira_em")
    private Instant expiraEm;

    @Column(name = "arquivos_excluidos_em")
    private Instant arquivosExcluidosEm;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected Galeria() {
        // JPA
    }

    public Galeria(UUID clienteId, String titulo, Integer limiteFotos, Instant agora) {
        this.id = UUID.randomUUID();
        this.clienteId = clienteId;
        this.titulo = titulo.trim();
        this.limiteFotos = limiteFotos;
        this.status = StatusGaleria.CRIADA;
        this.criadoEm = agora;
        this.atualizadoEm = agora;
    }

    // ---- transições ----------------------------------------------------------

    public void liberarParaSelecao(Instant agora) {
        exigir(StatusGaleria.CRIADA, "A galeria já foi liberada.");
        mudar(StatusGaleria.AGUARDANDO_SELECAO, agora);
    }

    public void enviarSelecao(String observacao, Instant agora) {
        exigir(StatusGaleria.AGUARDANDO_SELECAO, "A seleção desta galeria já foi enviada.");
        this.observacaoCliente = observacao == null || observacao.isBlank() ? null : observacao.trim();
        this.selecaoEnviadaEm = agora;
        mudar(StatusGaleria.SELECAO_ENVIADA, agora);
    }

    public void iniciarTratamento(Instant agora) {
        exigir(StatusGaleria.SELECAO_ENVIADA, "A seleção ainda não foi enviada.");
        mudar(StatusGaleria.EM_TRATAMENTO, agora);
    }

    /** Disponibiliza as fotos finais; o prazo de download começa a contar agora. */
    public void entregar(Duration retencao, Instant agora) {
        if (status != StatusGaleria.EM_TRATAMENTO && status != StatusGaleria.SELECAO_ENVIADA) {
            throw new RegraNegocioException("Só é possível entregar após a seleção do cliente.");
        }
        this.entregueEm = agora;
        this.expiraEm = agora.plus(retencao);
        mudar(StatusGaleria.ENTREGUE, agora);
    }

    public void expirar(Instant agora) {
        this.arquivosExcluidosEm = agora;
        mudar(StatusGaleria.EXPIRADA, agora);
    }

    public boolean permiteSelecao() {
        return status == StatusGaleria.AGUARDANDO_SELECAO;
    }

    public boolean finaisDisponiveis(Instant agora) {
        return status == StatusGaleria.ENTREGUE && expiraEm != null && agora.isBefore(expiraEm);
    }

    private void exigir(StatusGaleria esperado, String mensagem) {
        if (status != esperado) {
            throw new RegraNegocioException(mensagem);
        }
    }

    private void mudar(StatusGaleria novo, Instant agora) {
        this.status = novo;
        this.atualizadoEm = agora;
    }

    public UUID getId() { return id; }
    public UUID getClienteId() { return clienteId; }
    public String getTitulo() { return titulo; }
    public StatusGaleria getStatus() { return status; }
    public Integer getLimiteFotos() { return limiteFotos; }
    public String getObservacaoCliente() { return observacaoCliente; }
    public Instant getSelecaoEnviadaEm() { return selecaoEnviadaEm; }
    public Instant getEntregueEm() { return entregueEm; }
    public Instant getExpiraEm() { return expiraEm; }
    public Instant getArquivosExcluidosEm() { return arquivosExcluidosEm; }
    public Instant getCriadoEm() { return criadoEm; }
}
