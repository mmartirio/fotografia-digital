package br.com.fotografiadigital.aplicacao.galeria;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import br.com.fotografiadigital.dominio.galeria.StatusGaleria;
import br.com.fotografiadigital.dominio.galeria.TipoFoto;

/** DTOs de galeria compartilhados pela área do cliente e pelo painel. */
public final class GaleriaDtos {

    private GaleriaDtos() {
    }

    public record ClienteDto(UUID id, String nome, String email, String telefone) {
    }

    public record GaleriaResumo(
            UUID id,
            String titulo,
            StatusGaleria status,
            Integer limiteFotos,
            long totalOriginais,
            long selecionadas,
            long totalFinais,
            Instant criadoEm,
            Instant selecaoEnviadaEm,
            Instant entregueEm,
            Instant expiraEm,
            UUID capaFotoId,
            ClienteDto cliente) {
    }

    public record FotoDto(
            UUID id,
            TipoFoto tipo,
            String nomeOriginal,
            Integer largura,
            Integer altura,
            long tamanhoBytes,
            boolean selecionada,
            String comentario) {
    }

    public record GaleriaDetalhe(GaleriaResumo resumo, String observacaoCliente, List<FotoDto> originais, List<FotoDto> finais) {
    }

    /** Arquivo físico a servir + nome sugerido para download. */
    public record ArquivoFoto(java.nio.file.Path caminho, String nome) {
    }

    public enum Variante {
        MINIATURA,
        PREVIA,
        ARQUIVO
    }
}
