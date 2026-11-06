package br.com.fotografiadigital.aplicacao.site;

import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.dominio.NaoEncontradoException;
import br.com.fotografiadigital.dominio.RegraNegocioException;
import br.com.fotografiadigital.dominio.conteudo.ConteudoSecao;
import br.com.fotografiadigital.dominio.conteudo.ConteudoSecaoRepository;

/**
 * Conteúdo editável do site, uma seção por chave. O nav não é editável (fica no código).
 * Seções sem registro usam o padrão do frontend.
 */
@Service
public class ConteudoService {

    public static final Set<String> SECOES = Set.of("geral", "hero", "sobre", "portfolio", "servicos", "comoFunciona",
            "depoimentos", "faq", "orcamento", "ctaFinal", "contato", "seo", "aparencia", "rodape");

    private static final int TAMANHO_MAXIMO = 100_000;

    private final ConteudoSecaoRepository repo;
    private final ObjectMapper json;
    private final Clock relogio;

    public ConteudoService(ConteudoSecaoRepository repo, ObjectMapper json, Clock relogio) {
        this.repo = repo;
        this.json = json;
        this.relogio = relogio;
    }

    @Transactional(readOnly = true)
    public Map<String, JsonNode> todas() {
        Map<String, JsonNode> secoes = new LinkedHashMap<>();
        for (ConteudoSecao s : repo.findAll()) {
            if (!SECOES.contains(s.getChave())) continue;
            try {
                secoes.put(s.getChave(), json.readTree(s.getConteudo()));
            } catch (JacksonException e) {
                // conteúdo corrompido não derruba o site: cai no padrão do frontend
            }
        }
        return secoes;
    }

    @Transactional
    public void salvar(String chave, JsonNode conteudo) {
        if (!SECOES.contains(chave)) throw new NaoEncontradoException("Seção desconhecida: " + chave);
        if (conteudo == null || !conteudo.isObject()) throw new RegraNegocioException("O conteúdo deve ser um objeto JSON.");
        String texto = conteudo.toString();
        if (texto.length() > TAMANHO_MAXIMO) throw new RegraNegocioException("Conteúdo muito grande.");
        repo.findById(chave).ifPresentOrElse(
                s -> s.atualizar(texto, relogio.instant()),
                () -> repo.save(new ConteudoSecao(chave, texto, relogio.instant())));
    }

    @Transactional
    public void restaurarPadrao(String chave) {
        if (!SECOES.contains(chave)) throw new NaoEncontradoException("Seção desconhecida: " + chave);
        repo.deleteById(chave);
    }
}
