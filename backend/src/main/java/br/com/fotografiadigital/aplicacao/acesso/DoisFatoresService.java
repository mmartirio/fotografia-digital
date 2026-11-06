package br.com.fotografiadigital.aplicacao.acesso;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.OptionalLong;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.dominio.RegraNegocioException;
import br.com.fotografiadigital.dominio.usuario.CodigoRecuperacao;
import br.com.fotografiadigital.dominio.usuario.CodigoRecuperacaoRepository;
import br.com.fotografiadigital.dominio.usuario.Usuario;
import br.com.fotografiadigital.dominio.usuario.UsuarioRepository;
import br.com.fotografiadigital.infra.seguranca.Cifrador;
import br.com.fotografiadigital.infra.seguranca.QrCode;
import br.com.fotografiadigital.infra.seguranca.Tokens;
import br.com.fotografiadigital.infra.seguranca.Totp;

/**
 * Verificação em duas etapas do painel (TOTP + códigos de recuperação).
 * Fluxo: configurar (gera segredo pendente + QR) → ativar (1º código correto) →
 * login passa a exigir o código. Desativar exige senha + código.
 */
@Service
public class DoisFatoresService {

    static final int QTD_CODIGOS = 10;
    private static final String ALFABETO_CODIGOS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // sem 0/O, 1/I/L
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UsuarioRepository usuarios;
    private final CodigoRecuperacaoRepository codigos;
    private final PasswordEncoder encoder;
    private final Cifrador cifrador;
    private final Clock relogio;
    private final String emissor;

    public DoisFatoresService(UsuarioRepository usuarios, CodigoRecuperacaoRepository codigos, PasswordEncoder encoder,
            Cifrador cifrador, Clock relogio, @Value("${app.site.marca:Davi Foto Vídeo}") String emissor) {
        this.usuarios = usuarios;
        this.codigos = codigos;
        this.encoder = encoder;
        this.cifrador = cifrador;
        this.relogio = relogio;
        this.emissor = emissor;
    }

    public record Status(boolean ativo, long codigosRestantes) {
    }

    public record Configuracao(String segredo, String uri, String qrCode) {
    }

    @Transactional(readOnly = true)
    public Status status(UUID usuarioId) {
        Usuario u = usuario(usuarioId);
        return new Status(u.isTotpAtivo(), u.isTotpAtivo() ? codigos.countByUsuarioIdAndUsadoEmIsNull(usuarioId) : 0);
    }

    /** Gera um segredo novo (pendente) e o QR Code. Exige a senha atual. */
    @Transactional
    public Configuracao configurar(UUID usuarioId, String senha) {
        Usuario u = usuario(usuarioId);
        exigirSenha(u, senha);
        if (u.isTotpAtivo()) throw new RegraNegocioException("A verificação em duas etapas já está ativa.");
        String segredo = Totp.novoSegredo();
        u.iniciarDoisFatores(cifrador.cifrar(segredo));
        String uri = Totp.uri(emissor, u.getEmail(), segredo);
        return new Configuracao(segredo.replaceAll("(.{4})(?!$)", "$1 "), uri, QrCode.pngDataUri(uri, 240));
    }

    /** Confirma com o primeiro código do app e devolve os códigos de recuperação (exibidos uma única vez). */
    @Transactional
    public List<String> ativar(UUID usuarioId, String codigo) {
        Usuario u = usuario(usuarioId);
        if (u.isTotpAtivo()) throw new RegraNegocioException("A verificação em duas etapas já está ativa.");
        if (u.getTotpPendente() == null) throw new RegraNegocioException("Comece a configuração novamente.");
        OptionalLong passo = Totp.verificar(cifrador.decifrar(u.getTotpPendente()), codigo, relogio.instant(), null);
        if (passo.isEmpty()) {
            throw new RegraNegocioException("Código incorreto. Confira se o horário do celular está automático e tente de novo.");
        }
        u.ativarDoisFatores(passo.getAsLong());
        return gerarCodigos(u);
    }

    /** Novo conjunto de códigos de recuperação (os antigos deixam de valer). */
    @Transactional
    public List<String> novosCodigos(UUID usuarioId, String codigo) {
        Usuario u = usuario(usuarioId);
        if (!u.isTotpAtivo()) throw new RegraNegocioException("A verificação em duas etapas não está ativa.");
        if (!verificar(u, codigo)) throw new RegraNegocioException("Código incorreto.");
        return gerarCodigos(u);
    }

    @Transactional
    public void desativar(UUID usuarioId, String senha, String codigo) {
        Usuario u = usuario(usuarioId);
        exigirSenha(u, senha);
        if (!u.isTotpAtivo()) return;
        if (!verificar(u, codigo)) throw new RegraNegocioException("Código incorreto.");
        u.desativarDoisFatores();
        codigos.excluirDoUsuario(u.getId());
    }

    /**
     * Valida um código do app (6 dígitos, uso único) ou de recuperação (XXXXX-XXXXX, uso único).
     */
    @Transactional
    public boolean verificar(Usuario u, String codigo) {
        if (!u.isTotpAtivo() || codigo == null) return false;
        String limpo = codigo.replaceAll("[\\s-]", "").toUpperCase();
        Instant agora = relogio.instant();
        if (limpo.matches("\\d{" + Totp.DIGITOS + "}")) {
            OptionalLong passo = Totp.verificar(cifrador.decifrar(u.getTotpSegredo()), limpo, agora, u.getTotpUltimoPasso());
            passo.ifPresent(u::registrarPassoUsado);
            return passo.isPresent();
        }
        return codigos.findByUsuarioIdAndCodigoHash(u.getId(), Tokens.hash(limpo))
                .filter(CodigoRecuperacao::disponivel)
                .map(c -> {
                    c.usar(agora);
                    return true;
                })
                .orElse(false);
    }

    private List<String> gerarCodigos(Usuario u) {
        codigos.excluirDoUsuario(u.getId());
        codigos.flush();
        Instant agora = relogio.instant();
        List<String> gerados = new ArrayList<>();
        for (int i = 0; i < QTD_CODIGOS; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < 10; j++) sb.append(ALFABETO_CODIGOS.charAt(RANDOM.nextInt(ALFABETO_CODIGOS.length())));
            String codigo = sb.toString();
            codigos.save(new CodigoRecuperacao(u.getId(), Tokens.hash(codigo), agora));
            gerados.add(codigo.substring(0, 5) + "-" + codigo.substring(5));
        }
        return gerados;
    }

    private void exigirSenha(Usuario u, String senha) {
        if (senha == null || !encoder.matches(senha, u.getSenhaHash())) throw new RegraNegocioException("Senha incorreta.");
    }

    private Usuario usuario(UUID id) {
        return usuarios.findById(id).orElseThrow();
    }
}
