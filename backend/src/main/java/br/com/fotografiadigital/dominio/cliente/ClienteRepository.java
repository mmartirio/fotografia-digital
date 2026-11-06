package br.com.fotografiadigital.dominio.cliente;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, UUID> {

    Optional<Cliente> findByEmailIgnoreCase(String email);
}
