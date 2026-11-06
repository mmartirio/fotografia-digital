package br.com.fotografiadigital.aplicacao.acesso;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

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

    public SessaoService(SessaoRepository sessoes, Clock relogio) {
        this.sessoes = sessoes;
        this.relogio = relogio;
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

    private static ResponseCookie.ResponseCookieBuilder base(TipoSessao tipo, String valor, boolean seguro) {
        // SameSite=Lax + exigência de JSON nas mutações: proteção contra CSRF
        return ResponseCookie.from(tipo.cookie(), valor).httpOnly(true).secure(seguro).sameSite("Lax").path("/");
    }
}
