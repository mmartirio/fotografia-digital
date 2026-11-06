package br.com.fotografiadigital.dominio.galeria;

/**
 * Ciclo de vida: CRIADA → AGUARDANDO_SELECAO → SELECAO_ENVIADA → EM_TRATAMENTO → ENTREGUE → EXPIRADA.
 * CRIADA ainda não aparece para o cliente (fotógrafo subindo as fotos).
 */
public enum StatusGaleria {
    CRIADA,
    AGUARDANDO_SELECAO,
    SELECAO_ENVIADA,
    EM_TRATAMENTO,
    ENTREGUE,
    EXPIRADA;

    public boolean visivelAoCliente() {
        return this != CRIADA;
    }
}
