package br.com.fotografiadigital.api.painel;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.fotografiadigital.api.Arquivos;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.FotoDto;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaDetalhe;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaResumo;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.Variante;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaService;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaService.NovaGaleria;
import br.com.fotografiadigital.dominio.galeria.TipoFoto;

@RestController
@RequestMapping("/api/painel/galerias")
public class PainelGaleriasController {

    private final GaleriaService servico;

    public PainelGaleriasController(GaleriaService servico) {
        this.servico = servico;
    }

    public record NovaGaleriaRequest(
            @NotBlank @Size(max = 120) String clienteNome,
            @NotBlank @Email @Size(max = 180) String clienteEmail,
            @Size(max = 20) String clienteTelefone,
            @NotBlank @Size(max = 150) String titulo,
            @Min(1) Integer limiteFotos) {
    }

    @GetMapping
    public List<GaleriaResumo> listar() {
        return servico.listar();
    }

    @PostMapping
    public ResponseEntity<GaleriaResumo> criar(@Valid @RequestBody NovaGaleriaRequest r) {
        GaleriaResumo g = servico.criar(new NovaGaleria(r.clienteNome(), r.clienteEmail(), r.clienteTelefone(),
                r.titulo(), r.limiteFotos()));
        return ResponseEntity.status(HttpStatus.CREATED).body(g);
    }

    @GetMapping("/{id}")
    public GaleriaDetalhe detalhar(@PathVariable UUID id) {
        return servico.detalhar(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        servico.excluirGaleria(id);
        return ResponseEntity.noContent().build();
    }

    /** Uma foto por requisição: o painel envia em sequência e mostra o progresso. */
    @PostMapping("/{id}/fotos")
    public ResponseEntity<FotoDto> enviarFoto(@PathVariable UUID id, @RequestParam TipoFoto tipo,
            @RequestParam("arquivo") MultipartFile arquivo) throws IOException {
        try (InputStream in = arquivo.getInputStream()) {
            FotoDto foto = servico.adicionarFoto(id, tipo, arquivo.getOriginalFilename(), in);
            return ResponseEntity.status(HttpStatus.CREATED).body(foto);
        }
    }

    @DeleteMapping("/{id}/fotos/{fotoId}")
    public ResponseEntity<Void> excluirFoto(@PathVariable UUID id, @PathVariable UUID fotoId) {
        servico.excluirFoto(id, fotoId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/liberar")
    public GaleriaResumo liberar(@PathVariable UUID id) {
        return servico.liberarParaSelecao(id);
    }

    @PostMapping("/{id}/tratamento")
    public GaleriaResumo tratamento(@PathVariable UUID id) {
        return servico.iniciarTratamento(id);
    }

    @PostMapping("/{id}/entregar")
    public GaleriaResumo entregar(@PathVariable UUID id) {
        return servico.entregar(id);
    }

    @GetMapping("/{id}/fotos/{fotoId}/miniatura")
    public ResponseEntity<Resource> miniatura(@PathVariable UUID id, @PathVariable UUID fotoId) {
        return Arquivos.imagemPrivada(servico.arquivo(id, fotoId, Variante.MINIATURA));
    }

    @GetMapping("/{id}/fotos/{fotoId}/previa")
    public ResponseEntity<Resource> previa(@PathVariable UUID id, @PathVariable UUID fotoId) {
        return Arquivos.imagemPrivada(servico.arquivo(id, fotoId, Variante.PREVIA));
    }

    @GetMapping("/{id}/fotos/{fotoId}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id, @PathVariable UUID fotoId) {
        return Arquivos.download(servico.arquivo(id, fotoId, Variante.ARQUIVO));
    }
}
