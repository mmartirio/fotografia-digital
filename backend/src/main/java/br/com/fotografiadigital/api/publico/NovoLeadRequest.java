package br.com.fotografiadigital.api.publico;

import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Dados do formulário de orçamento. {@code site} é um honeypot: campo oculto
 * que humanos não preenchem; se vier preenchido, o pedido é descartado.
 */
public record NovoLeadRequest(
        @NotBlank @Size(max = 120) String nome,
        @Email @Size(max = 180) String email,
        @Pattern(regexp = "^[0-9+()\\-\\s]{8,20}$", message = "telefone inválido") String telefone,
        @Size(max = 80) String tipoEnsaio,
        LocalDate dataDesejada,
        @Size(max = 1000) String mensagem,
        String site) {

    @AssertTrue(message = "informe e-mail ou telefone")
    public boolean isContatoInformado() {
        return temTexto(email) || temTexto(telefone);
    }

    boolean ehRobo() {
        return temTexto(site);
    }

    static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    static String limpar(String valor) {
        return temTexto(valor) ? valor.trim() : null;
    }
}
