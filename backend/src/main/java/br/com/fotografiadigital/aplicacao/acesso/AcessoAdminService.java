package br.com.fotografiadigital.aplicacao.acesso;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.aplicacao.acesso.SessaoService.SessaoCriada;
import br.com.fotografiadigital.dominio.RegraNegocioException;
import br.com.fotografiadigital.dominio.acesso.TipoSessao;
import br.com.fotografiadigital.dominio.usuario.Usuario;
import br.com.fotografiadigital.dominio.usuario.UsuarioRepository;

/** Login do painel (e-mail + senha) com limite de tentativas por e-mail. */
@Service
public class AcessoAdminService {

    private static final Logger log = LoggerFactory.getLogger(AcessoAdminService.class);

    static final Duration DURACAO_SESSAO = Duration.ofDays(7);
    static final Duration JANELA_TENTATIVAS = Duration.ofMinutes(15);
    static final int MAX_TENTATIVAS = 5;

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final SessaoService sessoes;
    private final Clock relogio;
    private final Map<String, Deque<Instant>> falhas = new ConcurrentHashMap<>();

    public AcessoAdminService(UsuarioRepository usuarios, PasswordEncoder encoder, SessaoService sessoes, Clock relogio) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.sessoes = sessoes;
        this.relogio = relogio;
    }

    public sealed interface Resultado {
        record Ok(SessaoCriada sessao) implements Resultado {}
        record Invalido() implements Resultado {}
        record Bloqueado() implements Resultado {}
    }

    @Transactional
    public Resultado entrar(String email, String senha) {
        String chave = email.trim().toLowerCase();
        Instant agora = relogio.instant();
        if (bloqueado(chave, agora)) {
            log.warn("Login do painel bloqueado temporariamente por excesso de tentativas");
            return new Resultado.Bloqueado();
        }
        Optional<Usuario> usuario = usuarios.findByEmailIgnoreCase(chave)
                .filter(Usuario::isAtivo)
                .filter(u -> encoder.matches(senha, u.getSenhaHash()));
        if (usuario.isEmpty()) {
            registrarFalha(chave, agora);
            return new Resultado.Invalido();
        }
        falhas.remove(chave);
        return new Resultado.Ok(sessoes.criar(TipoSessao.ADMIN, usuario.get().getId(), DURACAO_SESSAO));
    }

    @Transactional
    public void trocarSenha(UUID usuarioId, String senhaAtual, String novaSenha) {
        Usuario usuario = usuarios.findById(usuarioId).orElseThrow();
        if (!encoder.matches(senhaAtual, usuario.getSenhaHash())) {
            throw new RegraNegocioException("Senha atual incorreta.");
        }
        usuario.trocarSenha(encoder.encode(novaSenha));
    }

    private boolean bloqueado(String chave, Instant agora) {
        Deque<Instant> tentativas = falhas.get(chave);
        if (tentativas == null) return false;
        synchronized (tentativas) {
            tentativas.removeIf(t -> t.isBefore(agora.minus(JANELA_TENTATIVAS)));
            return tentativas.size() >= MAX_TENTATIVAS;
        }
    }

    private void registrarFalha(String chave, Instant agora) {
        Deque<Instant> tentativas = falhas.computeIfAbsent(chave, k -> new ArrayDeque<>());
        synchronized (tentativas) {
            tentativas.addLast(agora);
        }
    }
}
