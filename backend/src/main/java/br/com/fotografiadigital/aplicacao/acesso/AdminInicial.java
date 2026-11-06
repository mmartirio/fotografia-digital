package br.com.fotografiadigital.aplicacao.acesso;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.dominio.usuario.Usuario;
import br.com.fotografiadigital.dominio.usuario.UsuarioRepository;
import br.com.fotografiadigital.infra.seguranca.Tokens;

/**
 * Cria o usuário do painel na primeira subida (banco sem usuários), a partir de
 * ADMIN_EMAIL / ADMIN_SENHA. Sem senha definida, gera uma e mostra no log uma única vez.
 */
@Component
public class AdminInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInicial.class);

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final Clock relogio;
    private final String email;
    private final String senha;
    private final String nome;

    public AdminInicial(UsuarioRepository usuarios, PasswordEncoder encoder, Clock relogio,
            @Value("${app.admin.email:admin@localhost}") String email,
            @Value("${app.admin.senha:}") String senha,
            @Value("${app.admin.nome:Davi}") String nome) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.relogio = relogio;
        this.email = email;
        this.senha = senha;
        this.nome = nome;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (usuarios.count() > 0) return;
        String senhaInicial = senha.isBlank() ? Tokens.gerar().substring(0, 16) : senha;
        usuarios.save(new Usuario(nome, email, encoder.encode(senhaInicial), relogio.instant()));
        if (senha.isBlank()) {
            log.warn("""

                    ==================================================================
                     Usuário do painel criado: {}
                     Senha gerada: {}
                     Troque a senha no painel (Conta) após o primeiro acesso.
                    ==================================================================""", email, senhaInicial);
        } else {
            log.info("Usuário do painel criado: {}", email);
        }
    }
}
