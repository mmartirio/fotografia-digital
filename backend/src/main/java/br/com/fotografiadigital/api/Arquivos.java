package br.com.fotografiadigital.api;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.ArquivoFoto;

/** Respostas de arquivo: imagens inline com cache privado, downloads e ZIP em streaming. */
public final class Arquivos {

    private Arquivos() {
    }

    public static ResponseEntity<Resource> imagem(java.nio.file.Path caminho, CacheControl cache) {
        return ResponseEntity.ok()
                .cacheControl(cache)
                .contentType(tipo(caminho.getFileName().toString()))
                .body(new FileSystemResource(caminho));
    }

    public static ResponseEntity<Resource> imagemPrivada(ArquivoFoto a) {
        return imagem(a.caminho(), CacheControl.maxAge(Duration.ofHours(12)).cachePrivate());
    }

    public static ResponseEntity<Resource> download(ArquivoFoto a) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(a.nome(), StandardCharsets.UTF_8).build().toString())
                .contentType(tipo(a.nome()))
                .body(new FileSystemResource(a.caminho()));
    }

    public static ResponseEntity<StreamingResponseBody> zip(String nomeZip, List<ArquivoFoto> arquivos) {
        StreamingResponseBody corpo = (OutputStream saida) -> {
            try (ZipOutputStream zip = new ZipOutputStream(saida)) {
                zip.setLevel(Deflater.NO_COMPRESSION); // JPEG já é comprimido: só empacota
                Set<String> usados = new HashSet<>();
                for (ArquivoFoto a : arquivos) {
                    zip.putNextEntry(new ZipEntry(nomeUnico(a.nome(), usados)));
                    Files.copy(a.caminho(), zip);
                    zip.closeEntry();
                }
            } catch (IOException e) {
                // cliente cancelou o download: nada a fazer
            }
        };
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(nomeZip, StandardCharsets.UTF_8).build().toString())
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(corpo);
    }

    static String nomeUnico(String nome, Set<String> usados) {
        String candidato = nome;
        int n = 2;
        while (!usados.add(candidato.toLowerCase(Locale.ROOT))) {
            int ponto = nome.lastIndexOf('.');
            candidato = ponto > 0 ? nome.substring(0, ponto) + " (" + n + ")" + nome.substring(ponto) : nome + " (" + n + ")";
            n++;
        }
        return candidato;
    }

    private static MediaType tipo(String nome) {
        return nome.toLowerCase(Locale.ROOT).endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
    }
}
