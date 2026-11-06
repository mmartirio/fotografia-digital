package br.com.fotografiadigital;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.util.UUID;
import java.util.zip.ZipInputStream;

import javax.imageio.ImageIO;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import br.com.fotografiadigital.aplicacao.galeria.ExpiracaoGalerias;

/** Fluxo completo painel ↔ cliente, mais as regras de acesso. */
class FluxoGaleriaTest extends TesteIntegracao {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired ExpiracaoGalerias expiracao;

    // ---- auxiliares ----------------------------------------------------------

    static byte[] jpeg(int largura, int altura, Color cor) throws Exception {
        BufferedImage img = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(cor);
        g.fillRect(0, 0, largura, altura);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", out);
        return out.toByteArray();
    }

    Cookie loginPainel() throws Exception {
        MvcResult r = mvc.perform(post("/api/publico/acesso/painel/entrar").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(java.util.Map.of("email", ADMIN_EMAIL, "senha", ADMIN_SENHA))))
                .andExpect(status().isOk()).andReturn();
        return r.getResponse().getCookie("fd_painel");
    }

    Cookie loginCliente(String email) throws Exception {
        MvcResult r = mvc.perform(post("/api/publico/acesso/cliente/link").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isAccepted()).andReturn();
        String link = json.readTree(r.getResponse().getContentAsString()).path("linkDev").asText();
        assertThat(link).contains("/cliente/entrar?token=");
        String token = link.substring(link.indexOf("token=") + 6);
        MvcResult entrada = mvc.perform(post("/api/publico/acesso/cliente/entrar").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\"}")).andExpect(status().isOk()).andReturn();
        // link é de uso único
        mvc.perform(post("/api/publico/acesso/cliente/entrar").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\"}")).andExpect(status().isUnauthorized());
        return entrada.getResponse().getCookie("fd_sessao");
    }

    JsonNode corpo(AbstractMockHttpServletRequestBuilder<?> req, Cookie cookie, int statusEsperado) throws Exception {
        String s = mvc.perform(req.cookie(cookie)).andExpect(status().is(statusEsperado)).andReturn()
                .getResponse().getContentAsString();
        return s.isBlank() ? null : json.readTree(s);
    }

    UUID criarGaleria(Cookie painel, String email, String titulo) throws Exception {
        String body = json.writeValueAsString(java.util.Map.of("clienteNome", "Cliente " + titulo, "clienteEmail", email,
                "titulo", titulo, "limiteFotos", 2));
        return UUID.fromString(corpo(post("/api/painel/galerias").contentType(MediaType.APPLICATION_JSON).content(body),
                painel, 201).path("id").asText());
    }

    JsonNode enviarFoto(Cookie painel, UUID galeria, String tipo, String nome, int status) throws Exception {
        var arquivo = new MockMultipartFile("arquivo", nome, "image/jpeg", jpeg(2000, 1200, Color.ORANGE));
        return corpo(multipart("/api/painel/galerias/" + galeria + "/fotos").file(arquivo).param("tipo", tipo),
                painel, status);
    }

    // ---- fluxo ---------------------------------------------------------------

    @Test
    void fluxoCompletoDaGaleria() throws Exception {
        Cookie painel = loginPainel();
        String email = "ana-" + UUID.randomUUID() + "@teste.com";
        UUID galeria = criarGaleria(painel, email, "Ensaio da Ana");

        JsonNode f1 = enviarFoto(painel, galeria, "ORIGINAL", "IMG_0001.JPG", 201);
        enviarFoto(painel, galeria, "ORIGINAL", "IMG_0002.jpg", 201);
        assertThat(f1.path("largura").asInt()).isEqualTo(2000);
        // formato inválido
        var texto = new MockMultipartFile("arquivo", "virus.exe", "application/octet-stream", new byte[] {1, 2, 3});
        corpo(multipart("/api/painel/galerias/" + galeria + "/fotos").file(texto).param("tipo", "ORIGINAL"), painel, 409);
        // final antes da seleção: proibido
        enviarFoto(painel, galeria, "FINAL", "final.jpg", 409);

        // Cliente entra; galeria CRIADA ainda não aparece
        Cookie cliente = loginCliente(email);
        assertThat(corpo(get("/api/cliente/galerias"), cliente, 200)).isEmpty();

        corpo(post("/api/painel/galerias/" + galeria + "/liberar"), painel, 200);
        JsonNode lista = corpo(get("/api/cliente/galerias"), cliente, 200);
        assertThat(lista).hasSize(1);
        assertThat(lista.get(0).path("status").asText()).isEqualTo("AGUARDANDO_SELECAO");

        String foto = f1.path("id").asText();
        String baseFoto = "/api/cliente/galerias/" + galeria + "/fotos/" + foto;
        // prévia (com marca d'água) sim; arquivo bruto não
        mvc.perform(get(baseFoto + "/previa").cookie(cliente))
                .andExpect(status().isOk()).andExpect(header().string("Content-Type", "image/jpeg"));
        mvc.perform(get(baseFoto + "/download").cookie(cliente)).andExpect(status().isNotFound());

        // Seleção
        corpo(post("/api/cliente/galerias/" + galeria + "/enviar-selecao").contentType(MediaType.APPLICATION_JSON)
                .content("{}"), cliente, 409); // nada selecionado ainda
        JsonNode marcada = corpo(put(baseFoto + "/selecao").contentType(MediaType.APPLICATION_JSON)
                .content("{\"selecionada\":true,\"comentario\":\"clarear um pouco\"}"), cliente, 200);
        assertThat(marcada.path("selecionada").asBoolean()).isTrue();
        corpo(post("/api/cliente/galerias/" + galeria + "/enviar-selecao").contentType(MediaType.APPLICATION_JSON)
                .content("{\"observacao\":\"obrigada!\"}"), cliente, 200);
        corpo(put(baseFoto + "/selecao").contentType(MediaType.APPLICATION_JSON)
                .content("{\"selecionada\":false}"), cliente, 409); // travada

        // Painel vê a seleção
        JsonNode detalhe = corpo(get("/api/painel/galerias/" + galeria), painel, 200);
        assertThat(detalhe.path("resumo").path("selecionadas").asInt()).isEqualTo(1);
        assertThat(detalhe.path("observacaoCliente").asText()).isEqualTo("obrigada!");

        // Tratamento e entrega
        corpo(post("/api/painel/galerias/" + galeria + "/tratamento"), painel, 200);
        corpo(post("/api/painel/galerias/" + galeria + "/entregar"), painel, 409); // sem finais
        JsonNode fin = enviarFoto(painel, galeria, "FINAL", "Ana-final-1.jpg", 201);
        enviarFoto(painel, galeria, "FINAL", "Ana-final-1.jpg", 201); // nome repetido → ZIP renomeia
        JsonNode entregue = corpo(post("/api/painel/galerias/" + galeria + "/entregar"), painel, 200);
        assertThat(entregue.path("expiraEm").asText()).isNotBlank();

        // Cliente baixa
        JsonNode det = corpo(get("/api/cliente/galerias/" + galeria), cliente, 200);
        assertThat(det.path("finais")).hasSize(2);
        String baseFinal = "/api/cliente/galerias/" + galeria + "/fotos/" + fin.path("id").asText();
        mvc.perform(get(baseFinal + "/download").cookie(cliente))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("Ana-final-1.jpg")));
        MvcResult zipAsync = mvc.perform(get("/api/cliente/galerias/" + galeria + "/download.zip").cookie(cliente))
                .andExpect(request().asyncStarted()).andReturn();
        byte[] zip = mvc.perform(asyncDispatch(zipAsync)).andExpect(status().isOk()).andReturn().getResponse()
                .getContentAsByteArray();
        int entradas = 0;
        java.util.Set<String> nomes = new java.util.HashSet<>();
        try (ZipInputStream z = new ZipInputStream(new ByteArrayInputStream(zip))) {
            for (var e = z.getNextEntry(); e != null; e = z.getNextEntry()) {
                entradas++;
                nomes.add(e.getName());
            }
        }
        assertThat(entradas).isEqualTo(2);
        assertThat(nomes).containsExactlyInAnyOrder("Ana-final-1.jpg", "Ana-final-1 (2).jpg");

        // Expiração: prazo vencido → arquivos apagados, status EXPIRADA
        jdbc.update("update galeria set expira_em = now() - interval '1 day' where id = ?", galeria);
        assertThat(expiracao.executar()).isGreaterThanOrEqualTo(1);
        assertThat(Files.exists(ARMAZENAMENTO.resolve("galerias/" + galeria))).isFalse();
        assertThat(corpo(get("/api/cliente/galerias/" + galeria), cliente, 200).path("resumo").path("status").asText())
                .isEqualTo("EXPIRADA");
        mvc.perform(get(baseFinal + "/download").cookie(cliente)).andExpect(status().isNotFound());
    }

    @Test
    void clienteNaoAcessaGaleriaDeOutro() throws Exception {
        Cookie painel = loginPainel();
        String emailA = "a-" + UUID.randomUUID() + "@teste.com";
        String emailB = "b-" + UUID.randomUUID() + "@teste.com";
        UUID galeriaB = criarGaleria(painel, emailB, "Galeria B");
        JsonNode foto = enviarFoto(painel, galeriaB, "ORIGINAL", "b.jpg", 201);
        corpo(post("/api/painel/galerias/" + galeriaB + "/liberar"), painel, 200);
        criarGaleria(painel, emailA, "Galeria A");

        Cookie clienteA = loginCliente(emailA);
        mvc.perform(get("/api/cliente/galerias/" + galeriaB).cookie(clienteA)).andExpect(status().isNotFound());
        mvc.perform(get("/api/cliente/galerias/" + galeriaB + "/fotos/" + foto.path("id").asText() + "/previa")
                .cookie(clienteA)).andExpect(status().isNotFound());
        // cliente não entra no painel
        mvc.perform(get("/api/painel/galerias").cookie(clienteA)).andExpect(status().isForbidden());
    }

    @Test
    void protecoesDeAcesso() throws Exception {
        mvc.perform(get("/api/cliente/galerias")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/painel/galerias")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/cliente/galerias").cookie(new Cookie("fd_sessao", "inventado")))
                .andExpect(status().isUnauthorized());

        // e-mail desconhecido: mesma resposta, sem link
        MvcResult r = mvc.perform(post("/api/publico/acesso/cliente/link").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ninguem@teste.com\"}")).andExpect(status().isAccepted()).andReturn();
        assertThat(json.readTree(r.getResponse().getContentAsString()).has("linkDev")).isFalse();

        // senha errada e bloqueio após 5 tentativas
        String login = "{\"email\":\"bloqueio@teste.com\",\"senha\":\"errada\"}";
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/publico/acesso/painel/entrar").contentType(MediaType.APPLICATION_JSON).content(login))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/publico/acesso/painel/entrar").contentType(MediaType.APPLICATION_JSON).content(login))
                .andExpect(status().isTooManyRequests());

        // sair invalida a sessão
        Cookie painel = loginPainel();
        mvc.perform(post("/api/publico/acesso/painel/sair").cookie(painel)).andExpect(status().isNoContent());
        mvc.perform(get("/api/painel/eu").cookie(painel)).andExpect(status().isUnauthorized());
    }

    @Test
    void conteudoEPortfolio() throws Exception {
        Cookie painel = loginPainel();
        corpo(put("/api/painel/conteudo/hero").contentType(MediaType.APPLICATION_JSON)
                .content("{\"titulo\":\"Novo título\"}"), painel, 204);
        corpo(put("/api/painel/conteudo/nav").contentType(MediaType.APPLICATION_JSON).content("{}"), painel, 404);

        var arquivo = new MockMultipartFile("arquivo", "retrato.png", "image/png", jpeg(3000, 2000, Color.BLUE));
        JsonNode foto = corpo(multipart("/api/painel/portfolio").file(arquivo).param("categoria", "ensaios")
                .param("alt", "Retrato azul"), painel, 201);
        assertThat(foto.path("largura").asInt()).isEqualTo(2400); // redimensionada para web

        JsonNode publico = json.readTree(mvc.perform(get("/api/publico/conteudo")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(publico.path("secoes").path("hero").path("titulo").asText()).isEqualTo("Novo título");
        assertThat(publico.path("portfolio")).anySatisfy(f -> assertThat(f.path("alt").asText()).isEqualTo("Retrato azul"));

        mvc.perform(get(foto.path("src").asText())).andExpect(status().isOk());
        mvc.perform(get("/api/publico/imagens/site/..%2F..%2Fetc%2Fpasswd")).andExpect(status().is4xxClientError());

        corpo(delete("/api/painel/portfolio/" + foto.path("id").asText()), painel, 204);
        mvc.perform(get(foto.path("src").asText())).andExpect(status().isNotFound());
        jdbc.update("delete from conteudo_secao");
    }
}
