package br.com.fotografiadigital.api.painel;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.fotografiadigital.aplicacao.site.ConteudoService;
import br.com.fotografiadigital.aplicacao.site.ImagensSiteService;
import br.com.fotografiadigital.aplicacao.site.ImagensSiteService.ImagemSalva;
import br.com.fotografiadigital.aplicacao.site.PortfolioService;
import br.com.fotografiadigital.aplicacao.site.PortfolioService.FotoPortfolioDto;

/** Edição do site: textos por seção, imagens avulsas e portfólio. */
@RestController
@RequestMapping("/api/painel")
public class PainelSiteController {

    private final ConteudoService conteudo;
    private final PortfolioService portfolio;
    private final ImagensSiteService imagens;

    public PainelSiteController(ConteudoService conteudo, PortfolioService portfolio, ImagensSiteService imagens) {
        this.conteudo = conteudo;
        this.portfolio = portfolio;
        this.imagens = imagens;
    }

    public record EdicaoFoto(@Size(max = 80) String categoria, @Size(max = 200) String alt, boolean destaque) {
    }

    public record Ordem(@NotNull List<UUID> ids) {
    }

    public record ImagemDto(String src, int largura, int altura) {
    }

    // ---- conteúdo ----

    @GetMapping("/conteudo")
    public Map<String, JsonNode> conteudo() {
        return conteudo.todas();
    }

    @PutMapping("/conteudo/{chave}")
    public ResponseEntity<Void> salvar(@PathVariable String chave, @RequestBody JsonNode corpo) {
        conteudo.salvar(chave, corpo);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/conteudo/{chave}")
    public ResponseEntity<Void> restaurar(@PathVariable String chave) {
        conteudo.restaurarPadrao(chave);
        return ResponseEntity.noContent().build();
    }

    /** Imagem avulsa para uma seção (hero, sobre, CTA, SEO). */
    @PostMapping("/imagens")
    public ResponseEntity<ImagemDto> enviarImagem(@RequestParam("arquivo") MultipartFile arquivo) throws IOException {
        try (InputStream in = arquivo.getInputStream()) {
            ImagemSalva s = imagens.salvar("site", arquivo.getOriginalFilename(), in);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ImagemDto(s.src(), s.largura(), s.altura()));
        }
    }

    /** Logo (PNG com transparência). */
    @PostMapping("/imagens/logo")
    public ResponseEntity<ImagemDto> enviarLogo(@RequestParam("arquivo") MultipartFile arquivo) throws IOException {
        try (InputStream in = arquivo.getInputStream()) {
            ImagemSalva s = imagens.salvarLogo(arquivo.getOriginalFilename(), in);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ImagemDto(s.src(), s.largura(), s.altura()));
        }
    }

    // ---- portfólio ----

    @GetMapping("/portfolio")
    public List<FotoPortfolioDto> listar() {
        return portfolio.listar();
    }

    @PostMapping("/portfolio")
    public ResponseEntity<FotoPortfolioDto> adicionar(@RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam(defaultValue = "") String categoria, @RequestParam(defaultValue = "") String alt)
            throws IOException {
        try (InputStream in = arquivo.getInputStream()) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(portfolio.adicionar(categoria, alt, arquivo.getOriginalFilename(), in));
        }
    }

    @PutMapping("/portfolio/{id}")
    public FotoPortfolioDto editar(@PathVariable UUID id, @Valid @RequestBody EdicaoFoto r) {
        return portfolio.editar(id, r.categoria(), r.alt(), r.destaque());
    }

    @PutMapping("/portfolio/ordem")
    public ResponseEntity<Void> ordenar(@Valid @RequestBody Ordem r) {
        portfolio.ordenar(r.ids());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/portfolio/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        portfolio.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
