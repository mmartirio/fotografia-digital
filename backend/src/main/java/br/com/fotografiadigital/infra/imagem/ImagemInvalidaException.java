package br.com.fotografiadigital.infra.imagem;

public class ImagemInvalidaException extends RuntimeException {

    public ImagemInvalidaException(String mensagem, Throwable causa) {
        super(mensagem, causa);
    }
}
