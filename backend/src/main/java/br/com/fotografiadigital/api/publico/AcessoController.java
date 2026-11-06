package br.com.fotografiadigital.api.publico;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.fotografiadigital.aplicacao.acesso.AcessoAdminService;
import br.com.fotografiadigital.aplicacao.acesso.AcessoClienteService;
import br.com.fotografiadigital.aplicacao.acesso.SessaoService;
import br.com.fotografiadigital.dominio.acesso.TipoSessao;
import br.com.fotografiadigital.infra.email.EmailService;
import br.com.fotografiadigital.infra.seguranca.SessaoFiltro;

/** Entrada e saída: link mágico do cliente e login do painel. */
@RestController
@RequestMapping("/api/publico/acesso")
public class AcessoController {

    private final AcessoClienteService acessoCliente;
    private final AcessoAdminService acessoAdmin;
    private final SessaoService sessoes;
    private final boolean exporLinkDev;

    public AcessoController(AcessoClienteService acessoCliente, AcessoAdminService acessoAdmin, SessaoService sessoes,
            EmailService email, @Value("${app.acesso.expor-link-dev:false}") boolean exporLinkDev) {
        this.acessoCliente = acessoCliente;
        this.acessoAdmin = acessoAdmin;
        this.sessoes = sessoes;
        // Segurança: com SMTP configurado (produção), o link NUNCA volta na resposta
        this.exporLinkDev = exporLinkDev && !email.smtpConfigurado();
    }

    public record SolicitarLink(@NotBlank @Email @Size(max = 180) String email) {
    }

    public record Token(@NotBlank @Size(max = 200) String token) {
    }

    public record Login(@NotBlank @Email String email, @NotBlank @Size(max = 200) String senha) {
    }

    /** Sempre 202 com a mesma mensagem: não revela se o e-mail está cadastrado. */
    @PostMapping("/cliente/link")
    public ResponseEntity<Map<String, String>> solicitarLink(@Valid @RequestBody SolicitarLink req) {
        Optional<String> link = acessoCliente.solicitarLink(req.email());
        Map<String, String> corpo = new LinkedHashMap<>();
        corpo.put("mensagem", "Se este e-mail tiver uma galeria, você receberá o link de acesso em instantes.");
        // Somente no modo demonstração (sem SMTP): facilita testar o fluxo
        if (exporLinkDev) link.ifPresent(l -> corpo.put("linkDev", l));
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(corpo);
    }

    @PostMapping("/cliente/entrar")
    public ResponseEntity<Map<String, String>> entrarCliente(@Valid @RequestBody Token req, HttpServletRequest http) {
        return acessoCliente.entrar(req.token())
                .map(s -> ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, sessoes.cookie(s, http.isSecure()).toString())
                        .body(Map.of("status", "ok")))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("erro", "Este link expirou ou já foi usado. Peça um novo acesso.")));
    }

    @PostMapping("/cliente/sair")
    public ResponseEntity<Void> sairCliente(HttpServletRequest http) {
        return sair(http, TipoSessao.CLIENTE);
    }

    public record SegundoFator(@NotBlank @Size(max = 200) String desafio, @NotBlank @Size(max = 20) String codigo) {
    }

    /** 1ª etapa. Com 2FA ativo, responde {status:"2fa", desafio} sem criar sessão. */
    @PostMapping("/painel/entrar")
    public ResponseEntity<Map<String, String>> entrarPainel(@Valid @RequestBody Login req, HttpServletRequest http) {
        return resposta(acessoAdmin.entrar(req.email(), req.senha()), http, "E-mail ou senha incorretos.");
    }

    /** 2ª etapa: código do app autenticador ou de recuperação. */
    @PostMapping("/painel/2fa")
    public ResponseEntity<Map<String, String>> segundoFator(@Valid @RequestBody SegundoFator req, HttpServletRequest http) {
        return resposta(acessoAdmin.confirmarSegundoFator(req.desafio(), req.codigo()), http, "Código incorreto.");
    }

    private ResponseEntity<Map<String, String>> resposta(AcessoAdminService.Resultado r, HttpServletRequest http, String msgInvalido) {
        return switch (r) {
            case AcessoAdminService.Resultado.Ok ok -> ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, sessoes.cookie(ok.sessao(), http.isSecure()).toString())
                    .body(Map.of("status", "ok"));
            case AcessoAdminService.Resultado.SegundoFator s -> ResponseEntity.ok()
                    .body(Map.of("status", "2fa", "desafio", s.desafio()));
            case AcessoAdminService.Resultado.Invalido i -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erro", msgInvalido));
            case AcessoAdminService.Resultado.Bloqueado b -> ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("erro", "Muitas tentativas. Aguarde 15 minutos e tente novamente."));
            case AcessoAdminService.Resultado.Expirado e -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erro", "Sua tentativa de login expirou. Entre novamente com e-mail e senha.", "reiniciar", "true"));
        };
    }

    @PostMapping("/painel/sair")
    public ResponseEntity<Void> sairPainel(HttpServletRequest http) {
        return sair(http, TipoSessao.ADMIN);
    }

    private ResponseEntity<Void> sair(HttpServletRequest http, TipoSessao tipo) {
        SessaoFiltro.cookie(http, tipo.cookie()).ifPresent(sessoes::encerrar);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, sessoes.cookieRemovido(tipo, http.isSecure()).toString())
                .build();
    }
}
