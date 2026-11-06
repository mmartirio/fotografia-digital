package br.com.fotografiadigital.dominio.galeria;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface FotoGaleriaRepository extends JpaRepository<FotoGaleria, UUID> {

    List<FotoGaleria> findByGaleriaIdAndTipoOrderByOrdemAscCriadoEmAsc(UUID galeriaId, TipoFoto tipo);

    Optional<FotoGaleria> findByIdAndGaleriaId(UUID id, UUID galeriaId);

    long countByGaleriaIdAndTipo(UUID galeriaId, TipoFoto tipo);

    long countByGaleriaIdAndTipoAndSelecionadaTrue(UUID galeriaId, TipoFoto tipo);

    @Query("select coalesce(max(f.ordem), 0) from FotoGaleria f where f.galeriaId = ?1 and f.tipo = ?2")
    int maiorOrdem(UUID galeriaId, TipoFoto tipo);

    @Modifying
    @Query("delete from FotoGaleria f where f.galeriaId = ?1")
    int excluirDaGaleria(UUID galeriaId);
}
