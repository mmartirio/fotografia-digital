package br.com.fotografiadigital.infra.armazenamento;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Garante a estrutura de pastas do armazenamento na subida da aplicação.
 *
 * <pre>
 * {diretorio}/
 *   site/       imagens do conteúdo do site (hero, sobre, SEO)
 *   portfolio/  fotos do portfólio público
 *   galerias/   {galeriaId}/originais | previas | finais
 * </pre>
 */
@Component
public class InicializadorArmazenamento implements ApplicationRunner {

    static final List<String> SUBPASTAS = List.of("site", "portfolio", "galerias");

    private static final Logger log = LoggerFactory.getLogger(InicializadorArmazenamento.class);

    private final ArmazenamentoProperties properties;

    public InicializadorArmazenamento(ArmazenamentoProperties properties) {
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        Path raiz = Path.of(properties.diretorio()).toAbsolutePath().normalize();
        try {
            for (String subpasta : SUBPASTAS) {
                Files.createDirectories(raiz.resolve(subpasta));
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível preparar o armazenamento em " + raiz, e);
        }
        if (!Files.isWritable(raiz)) {
            throw new IllegalStateException("Sem permissão de escrita no armazenamento: " + raiz);
        }
        log.info("Armazenamento de fotos pronto em {}", raiz);
    }
}
