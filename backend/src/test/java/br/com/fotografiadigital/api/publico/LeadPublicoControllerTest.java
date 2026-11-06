package br.com.fotografiadigital.api.publico;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import br.com.fotografiadigital.TesteIntegracao;
import br.com.fotografiadigital.dominio.lead.LeadRepository;
import br.com.fotografiadigital.dominio.lead.StatusLead;

class LeadPublicoControllerTest extends TesteIntegracao {

    @Autowired
    MockMvc mvc;

    @Autowired
    LeadRepository leads;

    @BeforeEach
    void limpar() {
        leads.deleteAll();
    }

    private void postar(String json, int statusEsperado) throws Exception {
        mvc.perform(post("/api/publico/leads").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().is(statusEsperado));
    }

    @Test
    void salvaLeadValido() throws Exception {
        postar("""
                {"nome":"  Ana Souza ","telefone":"(11) 98888-7777","email":"",
                 "tipoEnsaio":"Gestante","dataDesejada":"2027-01-10","mensagem":"Oi"}
                """, 201);

        assertThat(leads.findAll()).singleElement().satisfies(l -> {
            assertThat(l.getNome()).isEqualTo("Ana Souza");
            assertThat(l.getEmail()).isNull();
            assertThat(l.getTipoEnsaio()).isEqualTo("Gestante");
            assertThat(l.getStatus()).isEqualTo(StatusLead.NOVO);
        });
    }

    @Test
    void exigeEmailOuTelefone() throws Exception {
        postar("""
                {"nome":"Sem Contato"}
                """, 400);
        assertThat(leads.count()).isZero();
    }

    @Test
    void rejeitaEmailInvalido() throws Exception {
        postar("""
                {"nome":"Ana","email":"nao-e-email"}
                """, 400);
    }

    @Test
    void honeypotPreenchidoNaoSalvaMasRespondeSucesso() throws Exception {
        postar("""
                {"nome":"Robo","email":"robo@spam.com","site":"http://spam"}
                """, 201);
        assertThat(leads.count()).isZero();
    }
}
