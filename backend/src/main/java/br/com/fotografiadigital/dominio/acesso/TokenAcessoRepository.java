package br.com.fotografiadigital.dominio.acesso;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface TokenAcessoRepository extends JpaRepository<TokenAcesso, UUID> {

    Optional<TokenAcesso> findByTokenHash(String tokenHash);

    long countByClienteIdAndCriadoEmAfter(UUID clienteId, Instant desde);

    @Modifying
    @Query("delete from TokenAcesso t where t.expiraEm < ?1")
    int excluirExpirados(Instant limite);
}
