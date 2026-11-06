package br.com.fotografiadigital.api.publico;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import tools.jackson.databind.JsonNode;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.fotografiadigital.api.Arquivos;
import br.com.fotografiadigital.aplicacao.site.ConteudoService;
import br.com.fotografiadigital.aplicacao.site.ImagensSiteService;
import br.com.fotografiadigital.aplicacao.site.PortfolioService;
import br.com.fotografiadigital.aplicacao.site.PortfolioService.FotoPortfolioDto;

/** Conteúdo público da landing (lido pelo Next no servidor) e imagens do site. */
@RestController
@RequestMapping("/api/publico")
public class SitePublicoController {

    private final ConteudoService conteudo;
    private final PortfolioService portfolio;
    private final ImagensSiteService imagens;

    public SitePublicoController(ConteudoService conteudo, PortfolioService portfolio, ImagensSiteService imagens) {
        this.conteudo = conteudo;
        this.portfolio = portfolio;
        this.imagens = imagens;
    }

    public record ConteudoPublico(Map<String, JsonNode> secoes, List<FotoPortfolioDto> portfolio) {
    }

    @GetMapping("/conteudo")
    public ResponseEntity<ConteudoPublico> conteudo() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(new ConteudoPublico(conteudo.todas(), portfolio.listar()));
    }

    /** Nomes são UUIDs: o arquivo nunca muda, então pode ser cacheado por muito tempo. */
    @GetMapping("/imagens/{pasta}/{arquivo}")
    public ResponseEntity<Resource> imagem(@PathVariable String pasta, @PathVariable String arquivo) {
        return Arquivos.imagem(imagens.arquivoPublico(pasta, arquivo),
                CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
    }
}
