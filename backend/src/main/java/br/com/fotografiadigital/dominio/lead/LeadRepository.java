package br.com.fotografiadigital.dominio.lead;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadRepository extends JpaRepository<Lead, UUID> {

    List<Lead> findAllByOrderByCriadoEmDesc();

    long countByStatus(StatusLead status);
}
