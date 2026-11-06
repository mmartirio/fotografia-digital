package br.com.fotografiadigital.api.painel;

import java.time.Clock;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.fotografiadigital.aplicacao.acesso.AcessoAdminService;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaResumo;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaService;
import br.com.fotografiadigital.dominio.NaoEncontradoException;
import br.com.fotografiadigital.dominio.galeria.StatusGaleria;
import br.com.fotografiadigital.dominio.lead.Lead;
import br.com.fotografiadigital.dominio.lead.LeadRepository;
import br.com.fotografiadigital.dominio.lead.StatusLead;
import br.com.fotografiadigital.dominio.usuario.UsuarioRepository;
import br.com.fotografiadigital.infra.seguranca.Identidade;

/** Conta do fotógrafo, resumo do painel e leads. */
@RestController
@RequestMapping("/api/painel")
public class PainelGeralController {

    private final UsuarioRepository usuarios;
    private final AcessoAdminService acesso;
    private final GaleriaService galerias;
    private final LeadRepository leads;
    private final Clock relogio;

    public PainelGeralController(UsuarioRepository usuarios, AcessoAdminService acesso, GaleriaService galerias,
            LeadRepository leads, Clock relogio) {
        this.usuarios = usuarios;
        this.acesso = acesso;
        this.galerias = galerias;
        this.leads = leads;
        this.relogio = relogio;
    }

    public record Eu(UUID id, String nome, String email, boolean doisFatores) {
    }

    public record TrocaSenha(@NotBlank String senhaAtual, @NotBlank @Size(min = 8, max = 200) String novaSenha) {
    }

    public record Resumo(Map<StatusGaleria, Long> galeriasPorStatus, long leadsNovos, List<GaleriaResumo> expirandoEm7Dias,
            List<GaleriaResumo> aguardandoTratamento) {
    }

    public record LeadDto(UUID id, String nome, String email, String telefone, String tipoEnsaio,
            java.time.LocalDate dataDesejada, String mensagem, StatusLead status, Instant criadoEm) {
    }

    public record MudancaStatus(@NotNull StatusLead status) {
    }

    @GetMapping("/eu")
    public Eu eu(@AuthenticationPrincipal Identidade id) {
        var u = usuarios.findById(id.exigirAdmin()).orElseThrow();
        return new Eu(u.getId(), u.getNome(), u.getEmail(), u.isTotpAtivo());
    }

    @PostMapping("/senha")
    public ResponseEntity<Void> trocarSenha(@AuthenticationPrincipal Identidade id, @Valid @RequestBody TrocaSenha r) {
        acesso.trocarSenha(id.exigirAdmin(), r.senhaAtual(), r.novaSenha());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resumo")
    public Resumo resumo() {
        List<GaleriaResumo> todas = galerias.listar();
        Map<StatusGaleria, Long> porStatus = new EnumMap<>(StatusGaleria.class);
        for (StatusGaleria s : StatusGaleria.values()) porStatus.put(s, 0L);
        todas.forEach(g -> porStatus.merge(g.status(), 1L, Long::sum));
        Instant limite = relogio.instant().plusSeconds(7 * 24 * 3600);
        List<GaleriaResumo> expirando = todas.stream()
                .filter(g -> g.status() == StatusGaleria.ENTREGUE && g.expiraEm() != null && g.expiraEm().isBefore(limite))
                .toList();
        List<GaleriaResumo> tratar = todas.stream()
                .filter(g -> g.status() == StatusGaleria.SELECAO_ENVIADA || g.status() == StatusGaleria.EM_TRATAMENTO)
                .toList();
        return new Resumo(porStatus, leads.countByStatus(StatusLead.NOVO), expirando, tratar);
    }

    @GetMapping("/leads")
    @Transactional(readOnly = true)
    public List<LeadDto> leads() {
        return leads.findAllByOrderByCriadoEmDesc().stream().map(PainelGeralController::dto).toList();
    }

    @PatchMapping("/leads/{id}")
    @Transactional
    public LeadDto mudarStatus(@PathVariable UUID id, @Valid @RequestBody MudancaStatus r) {
        Lead lead = leads.findById(id).orElseThrow(() -> new NaoEncontradoException("Pedido não encontrado."));
        lead.mudarStatus(r.status());
        return dto(lead);
    }

    private static LeadDto dto(Lead l) {
        return new LeadDto(l.getId(), l.getNome(), l.getEmail(), l.getTelefone(), l.getTipoEnsaio(), l.getDataDesejada(),
                l.getMensagem(), l.getStatus(), l.getCriadoEm());
    }
}
