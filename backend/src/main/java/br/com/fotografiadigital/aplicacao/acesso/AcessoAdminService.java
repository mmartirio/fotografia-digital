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
import br.com.fotografiadigital.infra.seguranca.Tokens;

/**
 * Login do painel: e-mail + senha e, se ativada, verificação em duas etapas.
 * - Falhas (senha ou código) contam por CONTA existente: 5 em 15 min bloqueiam a conta
 *   temporariamente. Contar só contas reais mantém a estrutura limitada em memória.
 * - Com 2FA ativo, a senha correta gera um "desafio" de 5 min (máx. 5 códigos tentados).
 */
@Service
public class AcessoAdminService {

    private static final Logger log = LoggerFactory.getLogger(AcessoAdminService.class);

    static final Duration DURACAO_SESSAO = Duration.ofDays(7);
    static final Duration JANELA_TENTATIVAS = Duration.ofMinutes(15);
    static final int MAX_TENTATIVAS = 5;
    static final Duration VALIDADE_DESAFIO = Duration.ofMinutes(5);
    static final int MAX_CODIGOS_POR_DESAFIO = 5;

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final SessaoService sessoes;
    private final DoisFatoresService doisFatores;
    private final Clock relogio;
    /** Hash fictício: usuário inexistente também paga o custo do bcrypt (não revela por tempo de resposta). */
    private final String hashFicticio;

    private final Map<UUID, Deque<Instant>> falhas = new ConcurrentHashMap<>();
    private final Map<String, Desafio> desafios = new ConcurrentHashMap<>();

    private static final class Desafio {
        final UUID usuarioId;
        final Instant expiraEm;
        int tentativas;

        Desafio(UUID usuarioId, Instant expiraEm) {
            this.usuarioId = usuarioId;
            this.expiraEm = expiraEm;
        }
    }

    public AcessoAdminService(UsuarioRepository usuarios, PasswordEncoder encoder, SessaoService sessoes,
            DoisFatoresService doisFatores, Clock relogio) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.sessoes = sessoes;
        this.doisFatores = doisFatores;
        this.relogio = relogio;
        this.hashFicticio = encoder.encode(Tokens.gerar());
    }

    public sealed interface Resultado {
        record Ok(SessaoCriada sessao) implements Resultado {}
        record SegundoFator(String desafio) implements Resultado {}
        record Invalido() implements Resultado {}
        record Bloqueado() implements Resultado {}
        record Expirado() implements Resultado {}
    }

    /** 1ª etapa: e-mail e senha. */
    @Transactional
    public Resultado entrar(String email, String senha) {
        Instant agora = relogio.instant();
        Optional<Usuario> conta = usuarios.findByEmailIgnoreCase(email.trim()).filter(Usuario::isAtivo);
        if (conta.isEmpty()) {
            encoder.matches(senha, hashFicticio);
            return new Resultado.Invalido();
        }
        Usuario u = conta.get();
        if (bloqueado(u.getId(), agora)) {
            log.warn("Login do painel bloqueado temporariamente (excesso de tentativas) para {}", u.getId());
            return new Resultado.Bloqueado();
        }
        if (!encoder.matches(senha, u.getSenhaHash())) {
            registrarFalha(u.getId(), agora);
            return new Resultado.Invalido();
        }
        if (u.isTotpAtivo()) {
            limparDesafiosVencidos(agora);
            String desafio = Tokens.gerar();
            desafios.put(Tokens.hash(desafio), new Desafio(u.getId(), agora.plus(VALIDADE_DESAFIO)));
            return new Resultado.SegundoFator(desafio);
        }
        falhas.remove(u.getId());
        return new Resultado.Ok(sessoes.criar(TipoSessao.ADMIN, u.getId(), DURACAO_SESSAO));
    }

    /** 2ª etapa: código do app autenticador (ou de recuperação). */
    @Transactional
    public Resultado confirmarSegundoFator(String desafioToken, String codigo) {
        Instant agora = relogio.instant();
        String chave = Tokens.hash(desafioToken == null ? "" : desafioToken);
        Desafio d = desafios.get(chave);
        if (d == null || agora.isAfter(d.expiraEm)) {
            desafios.remove(chave);
            return new Resultado.Expirado();
        }
        if (bloqueado(d.usuarioId, agora)) {
            desafios.remove(chave);
            return new Resultado.Bloqueado();
        }
        Usuario u = usuarios.findById(d.usuarioId).filter(Usuario::isAtivo).orElse(null);
        if (u != null && doisFatores.verificar(u, codigo)) {
            desafios.remove(chave);
            falhas.remove(u.getId());
            return new Resultado.Ok(sessoes.criar(TipoSessao.ADMIN, u.getId(), DURACAO_SESSAO));
        }
        registrarFalha(d.usuarioId, agora);
        synchronized (d) {
            if (++d.tentativas >= MAX_CODIGOS_POR_DESAFIO) desafios.remove(chave);
        }
        return new Resultado.Invalido();
    }

    @Transactional
    public void trocarSenha(UUID usuarioId, String senhaAtual, String novaSenha) {
        Usuario usuario = usuarios.findById(usuarioId).orElseThrow();
        if (!encoder.matches(senhaAtual, usuario.getSenhaHash())) {
            throw new RegraNegocioException("Senha atual incorreta.");
        }
        usuario.trocarSenha(encoder.encode(novaSenha));
    }

    private boolean bloqueado(UUID usuarioId, Instant agora) {
        Deque<Instant> tentativas = falhas.get(usuarioId);
        if (tentativas == null) return false;
        synchronized (tentativas) {
            tentativas.removeIf(t -> t.isBefore(agora.minus(JANELA_TENTATIVAS)));
            return tentativas.size() >= MAX_TENTATIVAS;
        }
    }

    private void registrarFalha(UUID usuarioId, Instant agora) {
        Deque<Instant> tentativas = falhas.computeIfAbsent(usuarioId, k -> new ArrayDeque<>());
        synchronized (tentativas) {
            tentativas.addLast(agora);
        }
    }

    private void limparDesafiosVencidos(Instant agora) {
        desafios.entrySet().removeIf(e -> agora.isAfter(e.getValue().expiraEm));
    }
}
