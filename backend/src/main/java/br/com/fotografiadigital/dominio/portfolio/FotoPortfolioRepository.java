package br.com.fotografiadigital.dominio.portfolio;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FotoPortfolioRepository extends JpaRepository<FotoPortfolio, UUID> {

    List<FotoPortfolio> findAllByOrderByOrdemAscCriadoEmAsc();

    @Query("select coalesce(max(f.ordem), 0) from FotoPortfolio f")
    int maiorOrdem();
}
