package br.com.fotografiadigital.aplicacao.acesso;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.dominio.acesso.Sessao;
import br.com.fotografiadigital.dominio.acesso.SessaoRepository;
import br.com.fotografiadigital.dominio.acesso.TipoSessao;
import br.com.fotografiadigital.infra.seguranca.Tokens;

@Service
public class SessaoService {

    public record SessaoCriada(TipoSessao tipo, String token, Instant expiraEm) {
    }

    private final SessaoRepository sessoes;
    private final Clock relogio;
    /**
     * Site publicado em HTTPS → cookie sempre Secure, mesmo que o TLS termine num proxy
     * à frente (onde a requisição chega ao backend como HTTP e isSecure() seria falso).
     */
    private final boolean forcarSeguro;

    public SessaoService(SessaoRepository sessoes, Clock relogio,
            @Value("${app.site.url-publica}") String urlSite) {
        this.sessoes = sessoes;
        this.relogio = relogio;
        this.forcarSeguro = urlSite.startsWith("https://");
    }

    @Transactional
    public SessaoCriada criar(TipoSessao tipo, UUID sujeito, Duration duracao) {
        Instant agora = relogio.instant();
        String token = Tokens.gerar();
        Sessao sessao = new Sessao(tipo, sujeito, Tokens.hash(token), agora.plus(duracao), agora);
        sessoes.save(sessao);
        return new SessaoCriada(tipo, token, sessao.getExpiraEm());
    }

    @Transactional(readOnly = true)
    public Optional<UUID> autenticar(TipoSessao tipo, String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        Instant agora = relogio.instant();
        return sessoes.findByTokenHashAndTipo(Tokens.hash(token), tipo)
                .filter(s -> s.valida(agora))
                .map(Sessao::getSujeitoId);
    }

    @Transactional
    public void encerrar(String token) {
        if (token != null && !token.isBlank()) {
            sessoes.excluirPorHash(Tokens.hash(token));
        }
    }

    @Transactional
    public int limparExpiradas() {
        return sessoes.excluirExpiradas(relogio.instant());
    }

    public ResponseCookie cookie(SessaoCriada sessao, boolean seguro) {
        Duration maxAge = Duration.between(relogio.instant(), sessao.expiraEm());
        return base(sessao.tipo(), sessao.token(), seguro).maxAge(maxAge).build();
    }

    public ResponseCookie cookieRemovido(TipoSessao tipo, boolean seguro) {
        return base(tipo, "", seguro).maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(TipoSessao tipo, String valor, boolean seguro) {
        // SameSite=Lax: o navegador não envia o cookie em POST/PUT/DELETE vindos de outro site (CSRF)
        return ResponseCookie.from(tipo.cookie(), valor).httpOnly(true).secure(seguro || forcarSeguro).sameSite("Lax").path("/");
    }
}
