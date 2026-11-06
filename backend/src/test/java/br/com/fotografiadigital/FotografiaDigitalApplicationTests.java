package br.com.fotografiadigital;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Sobe a aplicação inteira contra um Postgres real: valida migrações Flyway,
 * mapeamento JPA, segurança e a estrutura do armazenamento.
 */
class FotografiaDigitalApplicationTests extends TesteIntegracao {

    @Autowired
    MockMvc mvc;

    @Test
    void healthEstaPublicoEUp() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void rotasPrivadasExigemAutenticacao() throws Exception {
        mvc.perform(get("/api/painel/qualquer"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void endpointPublicoDeOrcamentoFoiRemovido() throws Exception {
        // formulário saiu do site: o endpoint não pode continuar aceitando dados (spam/flood)
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/publico/leads")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content("{\"nome\":\"x\",\"email\":\"a@b.com\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void criaEstruturaDePastasDoArmazenamento() {
        for (String subpasta : new String[] {"site", "portfolio", "galerias"}) {
            assertThat(Files.isDirectory(ARMAZENAMENTO.resolve(subpasta))).as("pasta %s", subpasta).isTrue();
        }
    }
}
