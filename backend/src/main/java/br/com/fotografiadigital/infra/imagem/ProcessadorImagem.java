package br.com.fotografiadigital.infra.imagem;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Path;

import javax.imageio.ImageIO;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Gera as variantes de cada foto:
 * - miniatura (~600px) para as grades;
 * - prévia (~1600px) com marca d'água, única versão das fotos brutas que o cliente vê.
 * A orientação EXIF é aplicada automaticamente pelo Thumbnailator.
 */
@Component
public class ProcessadorImagem {

    public static final int LADO_MINIATURA = 600;
    public static final int LADO_PREVIA = 1600;
    public static final int LADO_WEB = 2400;
    /** Acima disso recusa sem decodificar (protege contra "bombas" de descompressão). Câmeras atuais: ~24–60 MP. */
    public static final long MAX_PIXELS = 150_000_000L;

    private final String textoMarca;

    public ProcessadorImagem(@Value("${app.galeria.marca-dagua:DAVIFOTOVIDEO}") String textoMarca) {
        this.textoMarca = textoMarca;
    }

    public record Dimensoes(int largura, int altura) {
    }

    /** Lê a imagem (já orientada) e devolve suas dimensões; falha se não for imagem válida. */
    public BufferedImage carregar(Path origem) {
        exigirTamanhoSeguro(origem);
        try {
            BufferedImage img = Thumbnails.of(origem.toFile()).scale(1).asBufferedImage();
            return paraRgb(img);
        } catch (IOException e) {
            throw new ImagemInvalidaException("Arquivo não é uma imagem JPEG ou PNG válida.", e);
        }
    }

    /** Lê só o cabeçalho (largura × altura), sem carregar os pixels na memória. */
    void exigirTamanhoSeguro(Path origem) {
        try (javax.imageio.stream.ImageInputStream in = ImageIO.createImageInputStream(origem.toFile())) {
            var leitores = in == null ? null : ImageIO.getImageReaders(in);
            if (leitores == null || !leitores.hasNext()) {
                throw new ImagemInvalidaException("Arquivo não é uma imagem JPEG ou PNG válida.", null);
            }
            javax.imageio.ImageReader leitor = leitores.next();
            try {
                leitor.setInput(in, true, true);
                long pixels = (long) leitor.getWidth(0) * leitor.getHeight(0);
                if (pixels > MAX_PIXELS) {
                    throw new ImagemInvalidaException("Imagem grande demais (máximo de 150 megapixels).", null);
                }
            } finally {
                leitor.dispose();
            }
        } catch (IOException e) {
            throw new ImagemInvalidaException("Arquivo não é uma imagem JPEG ou PNG válida.", e);
        }
    }

    public void gerarMiniatura(BufferedImage img, Path destino) {
        escrever(redimensionar(img, LADO_MINIATURA), destino, 0.80f);
    }

    public void gerarPrevia(BufferedImage img, Path destino) {
        BufferedImage previa = redimensionar(img, LADO_PREVIA);
        aplicarMarcaDagua(previa);
        escrever(previa, destino, 0.82f);
    }

    /** Prévia das fotos FINAIS: mesmo tamanho, sem marca d'água (o cliente já pode baixá-las). */
    public void gerarPreviaLimpa(BufferedImage img, Path destino) {
        escrever(redimensionar(img, LADO_PREVIA), destino, 0.85f);
    }

    public static final int LADO_LOGO = 512;

    /** Logo: mantém PNG com transparência, até 512px. */
    public Dimensoes gerarLogo(Path origem, Path destino) {
        exigirTamanhoSeguro(origem);
        try {
            BufferedImage img = Thumbnails.of(origem.toFile()).size(LADO_LOGO, LADO_LOGO).imageType(BufferedImage.TYPE_INT_ARGB)
                    .asBufferedImage();
            destino.getParent().toFile().mkdirs();
            Thumbnails.of(img).scale(1).imageType(BufferedImage.TYPE_INT_ARGB).outputFormat("png").toFile(destino.toFile());
            return new Dimensoes(img.getWidth(), img.getHeight());
        } catch (IOException e) {
            throw new ImagemInvalidaException("Arquivo não é uma imagem JPEG ou PNG válida.", e);
        }
    }

    /** Versão otimizada para o site público (portfólio, hero etc.), sem marca d'água. */
    public void gerarWeb(BufferedImage img, Path destino) {
        escrever(redimensionar(img, LADO_WEB), destino, 0.85f);
    }

    public Dimensoes dimensoesWeb(BufferedImage img) {
        double escala = Math.min(1.0, (double) LADO_WEB / Math.max(img.getWidth(), img.getHeight()));
        return new Dimensoes((int) Math.round(img.getWidth() * escala), (int) Math.round(img.getHeight() * escala));
    }

    private BufferedImage redimensionar(BufferedImage img, int lado) {
        if (img.getWidth() <= lado && img.getHeight() <= lado) {
            return copiar(img);
        }
        try {
            return Thumbnails.of(img).size(lado, lado).asBufferedImage();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Texto repetido em diagonal, semitransparente: protege a prévia sem esconder a foto. */
    void aplicarMarcaDagua(BufferedImage img) {
        Graphics2D g = img.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            int tamanho = Math.max(18, Math.min(img.getWidth(), img.getHeight()) / 14);
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, tamanho));
            int larguraTexto = g.getFontMetrics().stringWidth(textoMarca);
            g.rotate(Math.toRadians(-30), img.getWidth() / 2.0, img.getHeight() / 2.0);
            int passoX = larguraTexto + tamanho * 2;
            int passoY = tamanho * 4;
            int extensao = Math.max(img.getWidth(), img.getHeight()) * 2;
            for (int y = -extensao; y < extensao; y += passoY) {
                int deslocamento = (y / passoY) % 2 == 0 ? 0 : passoX / 2;
                for (int x = -extensao + deslocamento; x < extensao; x += passoX) {
                    g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.22f));
                    g.setColor(Color.BLACK);
                    g.drawString(textoMarca, x + 2, y + 2);
                    g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.38f));
                    g.setColor(Color.WHITE);
                    g.drawString(textoMarca, x, y);
                }
            }
        } finally {
            g.dispose();
        }
    }

    private static void escrever(BufferedImage img, Path destino, float qualidade) {
        try {
            destino.getParent().toFile().mkdirs();
            Thumbnails.of(img).scale(1).outputFormat("jpg").outputQuality(qualidade).toFile(destino.toFile());
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao gravar " + destino, e);
        }
    }

    /** JPEG não tem canal alfa: achata PNG transparente sobre branco. */
    private static BufferedImage paraRgb(BufferedImage img) {
        if (img.getType() == BufferedImage.TYPE_INT_RGB) return img;
        BufferedImage rgb = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, img.getWidth(), img.getHeight());
        g.drawImage(img, 0, 0, null);
        g.dispose();
        return rgb;
    }

    private static BufferedImage copiar(BufferedImage img) {
        BufferedImage copia = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = copia.createGraphics();
        g.drawImage(img, 0, 0, null);
        g.dispose();
        return copia;
    }

    static {
        // Sem display no container
        System.setProperty("java.awt.headless", "true");
        ImageIO.setUseCache(false);
    }
}
