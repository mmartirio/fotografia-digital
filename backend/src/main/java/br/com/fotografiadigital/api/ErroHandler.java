package br.com.fotografiadigital.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import br.com.fotografiadigital.dominio.NaoEncontradoException;
import br.com.fotografiadigital.dominio.RegraNegocioException;
import br.com.fotografiadigital.infra.imagem.ImagemInvalidaException;

/** Converte exceções de negócio em respostas HTTP com mensagem em "detail". */
@RestControllerAdvice
public class ErroHandler {

    @ExceptionHandler(NaoEncontradoException.class)
    ProblemDetail naoEncontrado(NaoEncontradoException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(RegraNegocioException.class)
    ProblemDetail regra(RegraNegocioException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(ImagemInvalidaException.class)
    ProblemDetail imagem(ImagemInvalidaException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ProblemDetail grande(MaxUploadSizeExceededException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.PAYLOAD_TOO_LARGE, "Arquivo maior que o permitido.");
    }
}
