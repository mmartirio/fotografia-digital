package br.com.fotografiadigital.dominio.acesso;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SessaoRepository extends JpaRepository<Sessao, UUID> {

    Optional<Sessao> findByTokenHashAndTipo(String tokenHash, TipoSessao tipo);

    @Modifying
    @Query("delete from Sessao s where s.tokenHash = ?1")
    int excluirPorHash(String tokenHash);

    @Modifying
    @Query("delete from Sessao s where s.expiraEm < ?1")
    int excluirExpiradas(Instant limite);
}
