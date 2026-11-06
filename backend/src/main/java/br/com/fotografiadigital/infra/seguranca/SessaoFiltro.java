package br.com.fotografiadigital.infra.seguranca;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import br.com.fotografiadigital.aplicacao.acesso.SessaoService;
import br.com.fotografiadigital.dominio.acesso.TipoSessao;

/** Autentica a requisição a partir dos cookies de sessão (fd_sessao / fd_painel). */
public class SessaoFiltro extends OncePerRequestFilter {

    private final SessaoService sessoes;

    public SessaoFiltro(SessaoService sessoes) {
        this.sessoes = sessoes;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp, FilterChain chain)
            throws ServletException, IOException {
        UUID cliente = autenticar(req, TipoSessao.CLIENTE).orElse(null);
        UUID admin = autenticar(req, TipoSessao.ADMIN).orElse(null);
        if (cliente != null || admin != null) {
            List<SimpleGrantedAuthority> papeis = new ArrayList<>();
            if (cliente != null) papeis.add(new SimpleGrantedAuthority(TipoSessao.CLIENTE.papel()));
            if (admin != null) papeis.add(new SimpleGrantedAuthority(TipoSessao.ADMIN.papel()));
            var auth = new UsernamePasswordAuthenticationToken(new Identidade(cliente, admin), null, papeis);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(req, resp);
    }

    private Optional<UUID> autenticar(HttpServletRequest req, TipoSessao tipo) {
        return cookie(req, tipo.cookie()).flatMap(token -> sessoes.autenticar(tipo, token));
    }

    public static Optional<String> cookie(HttpServletRequest req, String nome) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return Optional.empty();
        for (Cookie c : cookies) {
            if (nome.equals(c.getName()) && !c.getValue().isBlank()) return Optional.of(c.getValue());
        }
        return Optional.empty();
    }
}
