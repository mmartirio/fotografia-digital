package br.com.fotografiadigital.api.painel;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.fotografiadigital.aplicacao.acesso.DoisFatoresService;
import br.com.fotografiadigital.aplicacao.acesso.DoisFatoresService.Configuracao;
import br.com.fotografiadigital.aplicacao.acesso.DoisFatoresService.Status;
import br.com.fotografiadigital.infra.seguranca.Identidade;

/** Configuração da verificação em duas etapas (Conta do painel). */
@RestController
@RequestMapping("/api/painel/2fa")
public class PainelDoisFatoresController {

    private final DoisFatoresService servico;

    public PainelDoisFatoresController(DoisFatoresService servico) {
        this.servico = servico;
    }

    public record Senha(@NotBlank @Size(max = 200) String senha) {
    }

    public record Codigo(@NotBlank @Size(max = 20) String codigo) {
    }

    public record SenhaECodigo(@NotBlank @Size(max = 200) String senha, @NotBlank @Size(max = 20) String codigo) {
    }

    @GetMapping
    public Status status(@AuthenticationPrincipal Identidade id) {
        return servico.status(id.exigirAdmin());
    }

    @PostMapping("/configurar")
    public Configuracao configurar(@AuthenticationPrincipal Identidade id, @Valid @RequestBody Senha r) {
        return servico.configurar(id.exigirAdmin(), r.senha());
    }

    @PostMapping("/ativar")
    public Map<String, List<String>> ativar(@AuthenticationPrincipal Identidade id, @Valid @RequestBody Codigo r) {
        return Map.of("codigosRecuperacao", servico.ativar(id.exigirAdmin(), r.codigo()));
    }

    @PostMapping("/codigos")
    public Map<String, List<String>> novosCodigos(@AuthenticationPrincipal Identidade id, @Valid @RequestBody Codigo r) {
        return Map.of("codigosRecuperacao", servico.novosCodigos(id.exigirAdmin(), r.codigo()));
    }

    @PostMapping("/desativar")
    public ResponseEntity<Void> desativar(@AuthenticationPrincipal Identidade id, @Valid @RequestBody SenhaECodigo r) {
        servico.desativar(id.exigirAdmin(), r.senha(), r.codigo());
        return ResponseEntity.noContent().build();
    }
}
