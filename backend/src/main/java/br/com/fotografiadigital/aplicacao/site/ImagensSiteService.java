package br.com.fotografiadigital.aplicacao.site;

import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import br.com.fotografiadigital.dominio.NaoEncontradoException;
import br.com.fotografiadigital.infra.armazenamento.Armazenamento;
import br.com.fotografiadigital.infra.imagem.ProcessadorImagem;
import br.com.fotografiadigital.infra.imagem.ProcessadorImagem.Dimensoes;

/**
 * Imagens públicas do site (pastas "site" e "portfolio"): grava versão web
 * (até 2400px) + miniatura, descartando o arquivo enviado.
 */
@Service
public class ImagensSiteService {

    private static final Pattern NOME_VALIDO = Pattern.compile("[A-Za-z0-9-]+(_m)?\\.(jpg|png)");

    private final Armazenamento armazenamento;
    private final ProcessadorImagem processador;

    public ImagensSiteService(Armazenamento armazenamento, ProcessadorImagem processador) {
        this.armazenamento = armazenamento;
        this.processador = processador;
    }

    public record ImagemSalva(UUID id, String arquivo, String miniatura, String src, int largura, int altura) {
    }

    public ImagemSalva salvar(String pasta, String nomeOriginal, InputStream conteudo) {
        exigirPasta(pasta);
        String extensao = extensao(nomeOriginal);
        UUID id = UUID.randomUUID();
        String temporario = pasta + "/envio-" + id + "." + extensao;
        String arquivo = pasta + "/" + id + ".jpg";
        String miniatura = pasta + "/" + id + "_m.jpg";
        armazenamento.salvar(temporario, conteudo);
        try {
            BufferedImage img = processador.carregar(armazenamento.resolver(temporario));
            processador.gerarWeb(img, armazenamento.resolver(arquivo));
            processador.gerarMiniatura(img, armazenamento.resolver(miniatura));
            Dimensoes d = processador.dimensoesWeb(img);
            return new ImagemSalva(id, arquivo, miniatura, urlPublica(arquivo), d.largura(), d.altura());
        } catch (RuntimeException e) {
            armazenamento.excluir(arquivo);
            armazenamento.excluir(miniatura);
            throw e;
        } finally {
            armazenamento.excluir(temporario);
        }
    }

    /** Logo do site: PNG com transparência preservada. */
    public ImagemSalva salvarLogo(String nomeOriginal, InputStream conteudo) {
        String extensao = extensao(nomeOriginal);
        UUID id = UUID.randomUUID();
        String temporario = "site/envio-" + id + "." + extensao;
        String arquivo = "site/logo-" + id + ".png";
        armazenamento.salvar(temporario, conteudo);
        try {
            Dimensoes d = processador.gerarLogo(armazenamento.resolver(temporario), armazenamento.resolver(arquivo));
            return new ImagemSalva(id, arquivo, arquivo, urlPublica(arquivo), d.largura(), d.altura());
        } finally {
            armazenamento.excluir(temporario);
        }
    }

    public Path arquivoPublico(String pasta, String nome) {
        exigirPasta(pasta);
        if (!NOME_VALIDO.matcher(nome).matches()) throw new NaoEncontradoException("Imagem não encontrada.");
        String relativo = pasta + "/" + nome;
        if (!armazenamento.existe(relativo)) throw new NaoEncontradoException("Imagem não encontrada.");
        return armazenamento.resolver(relativo);
    }

    public void excluir(String... relativos) {
        for (String r : relativos) armazenamento.excluir(r);
    }

    public static String urlPublica(String relativo) {
        return "/api/publico/imagens/" + relativo;
    }

    private static void exigirPasta(String pasta) {
        if (!"site".equals(pasta) && !"portfolio".equals(pasta)) throw new NaoEncontradoException("Pasta inválida.");
    }

    private static String extensao(String nome) {
        String n = nome == null ? "" : nome.toLowerCase();
        if (n.endsWith(".png")) return "png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "jpg";
        throw new br.com.fotografiadigital.dominio.RegraNegocioException("Formato não suportado. Envie JPG ou PNG.");
    }
}
