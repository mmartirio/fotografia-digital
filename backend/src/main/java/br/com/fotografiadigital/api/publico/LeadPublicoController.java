package br.com.fotografiadigital.api.publico;

import static br.com.fotografiadigital.api.publico.NovoLeadRequest.limpar;

import java.util.Map;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.fotografiadigital.dominio.lead.Lead;
import br.com.fotografiadigital.dominio.lead.LeadRepository;

@RestController
@RequestMapping("/api/publico/leads")
public class LeadPublicoController {

    private static final Logger log = LoggerFactory.getLogger(LeadPublicoController.class);

    private final LeadRepository leads;

    public LeadPublicoController(LeadRepository leads) {
        this.leads = leads;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, String>> criar(@Valid @RequestBody NovoLeadRequest req) {
        if (req.ehRobo()) {
            // Responde como sucesso para não dar pista ao robô
            log.info("Lead descartado pelo honeypot");
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "recebido"));
        }
        Lead lead = new Lead(
                req.nome().trim(),
                limpar(req.email()),
                limpar(req.telefone()),
                limpar(req.tipoEnsaio()),
                req.dataDesejada(),
                limpar(req.mensagem()));
        leads.save(lead);
        log.info("Novo lead {} ({})", lead.getId(), lead.getTipoEnsaio());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "recebido"));
    }
}
