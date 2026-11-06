package br.com.fotografiadigital.dominio;

/** Operação válida em formato, mas não permitida no estado atual (HTTP 409). */
public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
