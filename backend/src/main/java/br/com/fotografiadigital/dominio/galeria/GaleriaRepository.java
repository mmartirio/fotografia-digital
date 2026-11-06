package br.com.fotografiadigital.dominio.galeria;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GaleriaRepository extends JpaRepository<Galeria, UUID> {

    List<Galeria> findByClienteIdAndStatusInOrderByCriadoEmDesc(UUID clienteId, Collection<StatusGaleria> status);

    Optional<Galeria> findByIdAndClienteId(UUID id, UUID clienteId);

    List<Galeria> findByStatusAndExpiraEmBefore(StatusGaleria status, Instant limite);
}
