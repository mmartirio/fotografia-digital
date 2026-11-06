package br.com.fotografiadigital.infra.armazenamento;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Diretório raiz onde as fotos ficam no disco (volume Docker em produção).
 */
@Validated
@ConfigurationProperties(prefix = "app.armazenamento")
public record ArmazenamentoProperties(@NotBlank String diretorio) {
}
