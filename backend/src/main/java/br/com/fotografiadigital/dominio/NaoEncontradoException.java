package br.com.fotografiadigital.dominio;

/** Recurso inexistente ou que não pertence ao usuário (HTTP 404, sem revelar qual dos dois). */
public class NaoEncontradoException extends RuntimeException {

    public NaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
