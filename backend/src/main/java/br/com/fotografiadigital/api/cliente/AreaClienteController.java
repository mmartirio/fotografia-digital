package br.com.fotografiadigital.api.cliente;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import br.com.fotografiadigital.api.Arquivos;
import br.com.fotografiadigital.aplicacao.galeria.AreaClienteService;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.ClienteDto;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.FotoDto;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaDetalhe;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaResumo;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.Variante;
import br.com.fotografiadigital.infra.seguranca.Identidade;

@RestController
@RequestMapping("/api/cliente")
public class AreaClienteController {

    private final AreaClienteService servico;

    public AreaClienteController(AreaClienteService servico) {
        this.servico = servico;
    }

    public record Marcacao(boolean selecionada, @Size(max = 500) String comentario) {
    }

    public record EnvioSelecao(@Size(max = 1000) String observacao) {
    }

    @GetMapping("/eu")
    public ClienteDto eu(@AuthenticationPrincipal Identidade id) {
        return servico.eu(id.exigirCliente());
    }

    @GetMapping("/galerias")
    public List<GaleriaResumo> galerias(@AuthenticationPrincipal Identidade id) {
        return servico.listar(id.exigirCliente());
    }

    @GetMapping("/galerias/{galeriaId}")
    public GaleriaDetalhe galeria(@AuthenticationPrincipal Identidade id, @PathVariable UUID galeriaId) {
        return servico.detalhar(id.exigirCliente(), galeriaId);
    }

    @PutMapping("/galerias/{galeriaId}/fotos/{fotoId}/selecao")
    public FotoDto marcar(@AuthenticationPrincipal Identidade id, @PathVariable UUID galeriaId,
            @PathVariable UUID fotoId, @Valid @RequestBody Marcacao req) {
        return servico.marcar(id.exigirCliente(), galeriaId, fotoId, req.selecionada(), req.comentario());
    }

    @PostMapping("/galerias/{galeriaId}/enviar-selecao")
    public GaleriaResumo enviarSelecao(@AuthenticationPrincipal Identidade id, @PathVariable UUID galeriaId,
            @Valid @RequestBody EnvioSelecao req) {
        return servico.enviarSelecao(id.exigirCliente(), galeriaId, req.observacao());
    }

    @GetMapping("/galerias/{galeriaId}/fotos/{fotoId}/miniatura")
    public ResponseEntity<Resource> miniatura(@AuthenticationPrincipal Identidade id, @PathVariable UUID galeriaId,
            @PathVariable UUID fotoId) {
        return Arquivos.imagemPrivada(servico.arquivo(id.exigirCliente(), galeriaId, fotoId, Variante.MINIATURA));
    }

    @GetMapping("/galerias/{galeriaId}/fotos/{fotoId}/previa")
    public ResponseEntity<Resource> previa(@AuthenticationPrincipal Identidade id, @PathVariable UUID galeriaId,
            @PathVariable UUID fotoId) {
        return Arquivos.imagemPrivada(servico.arquivo(id.exigirCliente(), galeriaId, fotoId, Variante.PREVIA));
    }

    @GetMapping("/galerias/{galeriaId}/fotos/{fotoId}/download")
    public ResponseEntity<Resource> download(@AuthenticationPrincipal Identidade id, @PathVariable UUID galeriaId,
            @PathVariable UUID fotoId) {
        return Arquivos.download(servico.arquivo(id.exigirCliente(), galeriaId, fotoId, Variante.ARQUIVO));
    }

    @GetMapping("/galerias/{galeriaId}/download.zip")
    public ResponseEntity<StreamingResponseBody> zip(@AuthenticationPrincipal Identidade id,
            @PathVariable UUID galeriaId) {
        UUID cliente = id.exigirCliente();
        var arquivos = servico.finaisParaZip(cliente, galeriaId);
        String nome = slug(servico.tituloGaleria(cliente, galeriaId)) + ".zip";
        return Arquivos.zip(nome, arquivos);
    }

    static String slug(String texto) {
        String s = java.text.Normalizer.normalize(texto, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return s.isEmpty() ? "fotos" : s;
    }
}
