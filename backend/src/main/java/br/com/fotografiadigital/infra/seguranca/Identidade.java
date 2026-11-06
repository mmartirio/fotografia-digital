package br.com.fotografiadigital.infra.seguranca;

import java.util.Optional;
import java.util.UUID;

/** Quem está autenticado na requisição: cliente, admin ou ambos (cookies distintos). */
public record Identidade(UUID clienteId, UUID adminId) {

    public UUID exigirCliente() {
        return Optional.ofNullable(clienteId).orElseThrow(() -> new IllegalStateException("Sem sessão de cliente"));
    }

    public UUID exigirAdmin() {
        return Optional.ofNullable(adminId).orElseThrow(() -> new IllegalStateException("Sem sessão de admin"));
    }
}
