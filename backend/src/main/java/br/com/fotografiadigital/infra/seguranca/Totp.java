package br.com.fotografiadigital.infra.seguranca;

import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.OptionalLong;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * TOTP (RFC 6238): HMAC-SHA1, 6 dígitos, passo de 30 s — o padrão dos apps
 * Google Authenticator, Microsoft Authenticator, Authy etc.
 */
public final class Totp {

    public static final int DIGITOS = 6;
    public static final long PASSO_SEGUNDOS = 30;
    /** Tolerância de relógio: aceita o passo anterior e o seguinte (±30 s). */
    public static final int JANELA = 1;

    private static final String ALFABETO_BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom RANDOM = new SecureRandom();

    private Totp() {
    }

    /** Segredo novo de 160 bits, em Base32 (formato aceito pelos apps). */
    public static String novoSegredo() {
        byte[] bytes = new byte[20];
        RANDOM.nextBytes(bytes);
        return base32(bytes);
    }

    public static long passo(Instant instante) {
        return instante.getEpochSecond() / PASSO_SEGUNDOS;
    }

    public static String codigo(String segredoBase32, long passo) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(base32Decode(segredoBase32), "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(passo).array());
            int deslocamento = hash[hash.length - 1] & 0x0f;
            int binario = ((hash[deslocamento] & 0x7f) << 24) | ((hash[deslocamento + 1] & 0xff) << 16)
                    | ((hash[deslocamento + 2] & 0xff) << 8) | (hash[deslocamento + 3] & 0xff);
            return String.format("%0" + DIGITOS + "d", binario % 1_000_000);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * Verifica o código e devolve o passo que casou (para bloquear reuso).
     * Só aceita passos estritamente posteriores a {@code ultimoPassoUsado}.
     */
    public static OptionalLong verificar(String segredoBase32, String codigoInformado, Instant agora, Long ultimoPassoUsado) {
        String codigo = codigoInformado == null ? "" : codigoInformado.replaceAll("\\s", "");
        if (!codigo.matches("\\d{" + DIGITOS + "}")) return OptionalLong.empty();
        long atual = passo(agora);
        for (long p = atual - JANELA; p <= atual + JANELA; p++) {
            if (ultimoPassoUsado != null && p <= ultimoPassoUsado) continue;
            // comparação em tempo constante
            if (MessageDigest.isEqual(codigo(segredoBase32, p).getBytes(), codigo.getBytes())) return OptionalLong.of(p);
        }
        return OptionalLong.empty();
    }

    /** URI otpauth:// lida pelo QR Code dos apps autenticadores. */
    public static String uri(String emissor, String conta, String segredoBase32) {
        String e = java.net.URLEncoder.encode(emissor, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
        String c = java.net.URLEncoder.encode(conta, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
        return "otpauth://totp/" + e + ":" + c + "?secret=" + segredoBase32 + "&issuer=" + e
                + "&algorithm=SHA1&digits=" + DIGITOS + "&period=" + PASSO_SEGUNDOS;
    }

    static String base32(byte[] dados) {
        StringBuilder sb = new StringBuilder();
        int buffer = 0, bits = 0;
        for (byte b : dados) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                sb.append(ALFABETO_BASE32.charAt((buffer >> (bits - 5)) & 31));
                bits -= 5;
            }
        }
        if (bits > 0) sb.append(ALFABETO_BASE32.charAt((buffer << (5 - bits)) & 31));
        return sb.toString();
    }

    static byte[] base32Decode(String texto) {
        String s = texto.replace("=", "").replace(" ", "").toUpperCase();
        ByteBuffer saida = ByteBuffer.allocate(s.length() * 5 / 8);
        int buffer = 0, bits = 0;
        for (char ch : s.toCharArray()) {
            int v = ALFABETO_BASE32.indexOf(ch);
            if (v < 0) throw new IllegalArgumentException("Base32 inválido");
            buffer = (buffer << 5) | v;
            bits += 5;
            if (bits >= 8) {
                saida.put((byte) ((buffer >> (bits - 8)) & 0xff));
                bits -= 8;
            }
        }
        return java.util.Arrays.copyOf(saida.array(), saida.position());
    }
}
