package br.com.fotografiadigital.infra.seguranca;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Base64;
import java.util.Map;

import javax.imageio.ImageIO;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

/** Gera QR Code como imagem PNG em data URI (gerado no servidor: o segredo não vai a serviços externos). */
public final class QrCode {

    private QrCode() {
    }

    public static String pngDataUri(String conteudo, int tamanho) {
        try {
            BitMatrix m = new QRCodeWriter().encode(conteudo, BarcodeFormat.QR_CODE, tamanho, tamanho,
                    Map.of(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M, EncodeHintType.MARGIN, 2));
            BufferedImage img = new BufferedImage(m.getWidth(), m.getHeight(), BufferedImage.TYPE_INT_RGB);
            for (int x = 0; x < m.getWidth(); x++) {
                for (int y = 0; y < m.getHeight(); y++) {
                    img.setRGB(x, y, m.get(x, y) ? 0x000000 : 0xFFFFFF);
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(img, "png", out);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (WriterException e) {
            throw new IllegalStateException("Falha ao gerar QR Code", e);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
