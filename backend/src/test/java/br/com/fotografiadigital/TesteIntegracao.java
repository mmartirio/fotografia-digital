package br.com.fotografiadigital;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Base dos testes de integração: um único Postgres (Testcontainers) e um único
 * contexto Spring compartilhados por todas as classes de teste.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class TesteIntegracao {

    protected static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine")
            .withStartupTimeout(Duration.ofMinutes(5));

    protected static final Path ARMAZENAMENTO;
    protected static final String ADMIN_EMAIL = "admin@teste.com";
    protected static final String ADMIN_SENHA = "senha-de-teste-123";

    static {
        POSTGRES.start(); // encerrado pelo Ryuk do Testcontainers ao fim da JVM
        try {
            ARMAZENAMENTO = Files.createTempDirectory("fotos-teste");
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @DynamicPropertySource
    static void propriedades(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("app.armazenamento.diretorio", ARMAZENAMENTO::toString);
        registry.add("app.acesso.expor-link-dev", () -> "true");
        registry.add("app.admin.email", () -> ADMIN_EMAIL);
        registry.add("app.admin.senha", () -> ADMIN_SENHA);
    }
}
