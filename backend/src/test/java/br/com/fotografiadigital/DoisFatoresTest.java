package br.com.fotografiadigital;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import br.com.fotografiadigital.dominio.usuario.Usuario;
import br.com.fotografiadigital.dominio.usuario.UsuarioRepository;
import br.com.fotografiadigital.infra.seguranca.Totp;

/** Verificação em duas etapas do painel (usuário próprio para não afetar os outros testes). */
class DoisFatoresTest extends TesteIntegracao {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;
    @Autowired Clock relogio;

    static final String SENHA = "senha-do-2fa-123";

    String novoUsuario() {
        String email = "dois-fatores-" + UUID.randomUUID() + "@teste.com";
        usuarios.save(new Usuario("Teste 2FA", email, encoder.encode(SENHA), Instant.now()));
        return email;
    }

    MvcResult login(String email) throws Exception {
        return mvc.perform(post("/api/publico/acesso/painel/entrar").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"" + SENHA + "\"}")).andExpect(status().isOk()).andReturn();
    }

    MvcResult segundoFator(String desafio, String codigo, int esperado) throws Exception {
        return mvc.perform(post("/api/publico/acesso/painel/2fa").contentType(MediaType.APPLICATION_JSON)
                .content("{\"desafio\":\"" + desafio + "\",\"codigo\":\"" + codigo + "\"}")).andExpect(status().is(esperado)).andReturn();
    }

    JsonNode lerJson(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    JsonNode postar(String url, Cookie c, String corpo, int esperado) throws Exception {
        String s = mvc.perform(post(url).cookie(c).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().is(esperado)).andReturn().getResponse().getContentAsString();
        return s.isBlank() ? null : json.readTree(s);
    }

    @Test
    void cicloCompletoDaVerificacaoEmDuasEtapas() throws Exception {
        String email = novoUsuario();
        Cookie sessao = login(email).getResponse().getCookie("fd_painel");
        assertThat(sessao).as("sem 2FA o login cria a sessão direto").isNotNull();

        // Configurar exige a senha
        postar("/api/painel/2fa/configurar", sessao, "{\"senha\":\"errada\"}", 409);
        JsonNode cfg = postar("/api/painel/2fa/configurar", sessao, "{\"senha\":\"" + SENHA + "\"}", 200);
        String segredo = cfg.path("segredo").asString().replace(" ", "");
        assertThat(cfg.path("uri").asString()).startsWith("otpauth://totp/").contains("secret=" + segredo);
        assertThat(cfg.path("qrCode").asString()).startsWith("data:image/png;base64,");

        // Segredo fica cifrado no banco (nunca em texto puro)
        Usuario salvo = usuarios.findByEmailIgnoreCase(email).orElseThrow();
        assertThat(salvo.getTotpPendente()).isNotBlank().doesNotContain(segredo);

        // Ativar: código errado não ativa; o certo devolve 10 códigos de recuperação
        long passo = Totp.passo(relogio.instant());
        postar("/api/painel/2fa/ativar", sessao, "{\"codigo\":\"000000\"}", 409);
        JsonNode ativado = postar("/api/painel/2fa/ativar", sessao, "{\"codigo\":\"" + Totp.codigo(segredo, passo) + "\"}", 200);
        assertThat(ativado.path("codigosRecuperacao")).hasSize(10);
        String recuperacao = ativado.path("codigosRecuperacao").get(0).asString();
        assertThat(recuperacao).matches("[A-Z0-9]{5}-[A-Z0-9]{5}");
        assertThat(lerJson(mvc.perform(get("/api/painel/eu").cookie(sessao)).andReturn()).path("doisFatores").asBoolean()).isTrue();

        // Login agora pede o 2º fator e NÃO cria sessão na 1ª etapa
        MvcResult etapa1 = login(email);
        assertThat(etapa1.getResponse().getCookie("fd_painel")).isNull();
        JsonNode r1 = lerJson(etapa1);
        assertThat(r1.path("status").asString()).isEqualTo("2fa");
        String desafio = r1.path("desafio").asString();

        segundoFator(desafio, "123456", 401);
        // o código usado na ativação não pode ser reutilizado (anti-replay); o próximo passo vale
        segundoFator(desafio, Totp.codigo(segredo, passo), 401);
        MvcResult ok = segundoFator(desafio, Totp.codigo(segredo, passo + 1), 200);
        assertThat(ok.getResponse().getCookie("fd_painel")).isNotNull();
        // desafio é de uso único
        segundoFator(desafio, Totp.codigo(segredo, passo + 1), 401);

        // Código de recuperação: vale uma vez só
        String d2 = lerJson(login(email)).path("desafio").asString();
        segundoFator(d2, recuperacao.toLowerCase(), 200);
        String d3 = lerJson(login(email)).path("desafio").asString();
        segundoFator(d3, recuperacao, 401);

        // Desativar exige senha + código
        String outro = ativado.path("codigosRecuperacao").get(1).asString();
        postar("/api/painel/2fa/desativar", sessao, "{\"senha\":\"" + SENHA + "\",\"codigo\":\"999999\"}", 409);
        postar("/api/painel/2fa/desativar", sessao, "{\"senha\":\"" + SENHA + "\",\"codigo\":\"" + outro + "\"}", 204);
        assertThat(login(email).getResponse().getCookie("fd_painel")).as("sem 2FA de novo").isNotNull();
    }

    @Test
    void desafioInvalidoOuForjadoNaoEntra() throws Exception {
        MvcResult r = segundoFator("desafio-inventado", "123456", 401);
        assertThat(lerJson(r).path("reiniciar").asString()).isEqualTo("true");
    }

    @Test
    void cincoCodigosErradosEncerramODesafio() throws Exception {
        String email = novoUsuario();
        Cookie sessao = login(email).getResponse().getCookie("fd_painel");
        String segredo = postar("/api/painel/2fa/configurar", sessao, "{\"senha\":\"" + SENHA + "\"}", 200)
                .path("segredo").asString().replace(" ", "");
        postar("/api/painel/2fa/ativar", sessao, "{\"codigo\":\"" + Totp.codigo(segredo, Totp.passo(relogio.instant())) + "\"}", 200);

        String desafio = lerJson(login(email)).path("desafio").asString();
        for (int i = 0; i < 4; i++) segundoFator(desafio, "000000", 401);
        // 5ª falha: conta bloqueada por 15 min e desafio descartado
        segundoFator(desafio, "000000", 401);
        mvc.perform(post("/api/publico/acesso/painel/entrar").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"" + SENHA + "\"}")).andExpect(status().isTooManyRequests());
    }
}
