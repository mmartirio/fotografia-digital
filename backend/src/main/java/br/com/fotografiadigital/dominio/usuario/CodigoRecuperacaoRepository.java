package br.com.fotografiadigital.dominio.usuario;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface CodigoRecuperacaoRepository extends JpaRepository<CodigoRecuperacao, UUID> {

    Optional<CodigoRecuperacao> findByUsuarioIdAndCodigoHash(UUID usuarioId, String codigoHash);

    long countByUsuarioIdAndUsadoEmIsNull(UUID usuarioId);

    @Modifying
    @Query("delete from CodigoRecuperacao c where c.usuarioId = ?1")
    int excluirDoUsuario(UUID usuarioId);
}
