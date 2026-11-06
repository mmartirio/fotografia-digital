package br.com.fotografiadigital.infra.armazenamento;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;

import org.springframework.stereotype.Component;

/**
 * Acesso ao disco das fotos. Todo caminho é relativo à raiz e validado para
 * não escapar dela (proteção contra path traversal).
 */
@Component
public class Armazenamento {

    private final Path raiz;

    public Armazenamento(ArmazenamentoProperties properties) {
        this.raiz = Path.of(properties.diretorio()).toAbsolutePath().normalize();
    }

    public Path resolver(String relativo) {
        Path caminho = raiz.resolve(relativo).normalize();
        if (!caminho.startsWith(raiz) || caminho.equals(raiz)) {
            throw new IllegalArgumentException("Caminho fora do armazenamento: " + relativo);
        }
        return caminho;
    }

    public long salvar(String relativo, InputStream conteudo) {
        Path destino = resolver(relativo);
        try {
            Files.createDirectories(destino.getParent());
            return Files.copy(conteudo, destino, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao salvar " + relativo, e);
        }
    }

    public boolean existe(String relativo) {
        return relativo != null && Files.isRegularFile(resolver(relativo));
    }

    public void excluir(String relativo) {
        if (relativo == null) return;
        try {
            Files.deleteIfExists(resolver(relativo));
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao excluir " + relativo, e);
        }
    }

    /** Remove uma pasta inteira (ex.: galerias/{id}). Silencioso se não existir. */
    public void excluirPasta(String relativo) {
        Path pasta = resolver(relativo);
        if (!Files.exists(pasta)) return;
        try {
            Files.walkFileTree(pasta, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path arquivo, BasicFileAttributes attrs) throws IOException {
                    Files.delete(arquivo);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    Files.delete(dir);
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao excluir pasta " + relativo, e);
        }
    }
}
