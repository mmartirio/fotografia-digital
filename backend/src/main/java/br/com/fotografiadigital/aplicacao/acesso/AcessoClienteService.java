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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.aplicacao.acesso.SessaoService.SessaoCriada;
import br.com.fotografiadigital.dominio.acesso.TipoSessao;
import br.com.fotografiadigital.dominio.acesso.TokenAcesso;
import br.com.fotografiadigital.dominio.acesso.TokenAcessoRepository;
import br.com.fotografiadigital.dominio.cliente.Cliente;
import br.com.fotografiadigital.dominio.cliente.ClienteRepository;
import br.com.fotografiadigital.infra.email.EmailService;
import br.com.fotografiadigital.infra.seguranca.Tokens;

/**
 * Login do cliente por link mágico: o cliente informa o e-mail, recebe um link de
 * uso único (30 min) e, ao abri-lo, ganha uma sessão de 7 dias.
 */
@Service
public class AcessoClienteService {

    private static final Logger log = LoggerFactory.getLogger(AcessoClienteService.class);

    static final Duration VALIDADE_LINK = Duration.ofMinutes(30);
    static final Duration DURACAO_SESSAO = Duration.ofDays(7);
    static final Duration JANELA_LIMITE = Duration.ofMinutes(15);
    static final int MAX_LINKS_NA_JANELA = 3;

    private final ClienteRepository clientes;
    private final TokenAcessoRepository tokens;
    private final SessaoService sessoes;
    private final EmailService email;
    private final Clock relogio;
    private final String urlSite;
    private final String marca;
    /** Pedidos feitos pelo próprio cliente (não conta os links enviados pelo painel). */
    private final Map<UUID, Deque<Instant>> pedidos = new ConcurrentHashMap<>();

    public AcessoClienteService(ClienteRepository clientes, TokenAcessoRepository tokens, SessaoService sessoes,
            EmailService email, Clock relogio, @Value("${app.site.url-publica}") String urlSite,
            @Value("${app.site.marca:Davi Foto Vídeo}") String marca) {
        this.clientes = clientes;
        this.tokens = tokens;
        this.sessoes = sessoes;
        this.email = email;
        this.relogio = relogio;
        this.urlSite = urlSite.replaceAll("/+$", "");
        this.marca = marca;
    }

    /**
     * Envia o link de acesso. Não revela se o e-mail existe (resposta é sempre a mesma).
     *
     * @return o link gerado (para exibir apenas no modo demonstração), ou vazio
     */
    @Transactional
    public Optional<String> solicitarLink(String emailInformado) {
        Optional<Cliente> encontrado = clientes.findByEmailIgnoreCase(emailInformado.trim());
        if (encontrado.isEmpty()) {
            log.info("Pedido de acesso para e-mail não cadastrado");
            return Optional.empty();
        }
        Cliente cliente = encontrado.get();
        Instant agora = relogio.instant();
        if (!dentroDoLimite(cliente.getId(), agora)) {
            log.warn("Limite de links de acesso atingido para o cliente {}", cliente.getId());
            return Optional.empty();
        }
        String link = gerarLink(cliente, agora);
        email.enviar(cliente.getEmail(), "Seu acesso à galeria · " + marca, """
                Olá, %s!

                Use o link abaixo para acessar suas fotos. Ele vale por 30 minutos e só pode ser usado uma vez:

                %s

                Se você não pediu este acesso, ignore este e-mail.

                %s
                """.formatted(cliente.getNome(), link, marca));
        return Optional.of(link);
    }

    private boolean dentroDoLimite(UUID clienteId, Instant agora) {
        Deque<Instant> lista = pedidos.computeIfAbsent(clienteId, k -> new ArrayDeque<>());
        synchronized (lista) {
            lista.removeIf(t -> t.isBefore(agora.minus(JANELA_LIMITE)));
            if (lista.size() >= MAX_LINKS_NA_JANELA) return false;
            lista.addLast(agora);
            return true;
        }
    }

    private String gerarLink(Cliente cliente, Instant agora) {
        return criarToken(cliente, agora, VALIDADE_LINK);
    }

    /**
     * Link com validade maior (7 dias), enviado quando o fotógrafo libera ou entrega
     * uma galeria: o cliente pode demorar a abrir o e-mail.
     */
    @Transactional
    public String gerarLinkLongo(Cliente cliente) {
        return criarToken(cliente, relogio.instant(), Duration.ofDays(7));
    }

    private String criarToken(Cliente cliente, Instant agora, Duration validade) {
        String token = Tokens.gerar();
        tokens.save(new TokenAcesso(cliente.getId(), Tokens.hash(token), agora.plus(validade), agora));
        return urlSite + "/cliente/entrar?token=" + token;
    }

    @Transactional
    public Optional<SessaoCriada> entrar(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        Instant agora = relogio.instant();
        return tokens.findByTokenHash(Tokens.hash(token))
                .filter(t -> t.utilizavel(agora))
                .map(t -> {
                    t.usar(agora);
                    return sessoes.criar(TipoSessao.CLIENTE, t.getClienteId(), DURACAO_SESSAO);
                });
    }

    @Transactional
    public int limparTokensExpirados() {
        return tokens.excluirExpirados(relogio.instant());
    }
}
