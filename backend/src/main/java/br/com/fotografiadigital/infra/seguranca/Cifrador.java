package br.com.fotografiadigital.infra.seguranca;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import br.com.fotografiadigital.infra.armazenamento.ArmazenamentoProperties;

/**
 * Cifra dados sensíveis guardados no banco (segredos do 2FA) com AES-256-GCM.
 * A chave fica FORA do banco: APP_CHAVE_CRIPTO (Base64, 32 bytes) ou, se não
 * definida, um arquivo gerado no volume de dados ({armazenamento}/.seguranca/chave).
 * Assim, um vazamento só do banco não revela os segredos.
 */
@Component
public class Cifrador {

    private static final Logger log = LoggerFactory.getLogger(Cifrador.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final SecretKeySpec chave;

    public Cifrador(@Value("${app.seguranca.chave-cripto:}") String chaveBase64, ArmazenamentoProperties armazenamento) {
        byte[] bytes = chaveBase64.isBlank() ? chaveDoArquivo(Path.of(armazenamento.diretorio())) : Base64.getDecoder().decode(chaveBase64.trim());
        if (bytes.length != 32) throw new IllegalStateException("APP_CHAVE_CRIPTO deve ter 32 bytes em Base64");
        this.chave = new SecretKeySpec(bytes, "AES");
    }

    public String cifrar(String texto) {
        try {
            byte[] iv = new byte[IV_BYTES];
            RANDOM.nextBytes(iv);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, chave, new GCMParameterSpec(TAG_BITS, iv));
            byte[] cifrado = c.doFinal(texto.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + cifrado.length).put(iv).put(cifrado).array());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao cifrar", e);
        }
    }

    public String decifrar(String base64) {
        try {
            byte[] tudo = Base64.getDecoder().decode(base64);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, chave, new GCMParameterSpec(TAG_BITS, tudo, 0, IV_BYTES));
            return new String(c.doFinal(tudo, IV_BYTES, tudo.length - IV_BYTES), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao decifrar (chave de criptografia mudou?)", e);
        }
    }

    private static byte[] chaveDoArquivo(Path raiz) {
        Path arquivo = raiz.toAbsolutePath().normalize().resolve(".seguranca").resolve("chave");
        try {
            if (Files.exists(arquivo)) return Base64.getDecoder().decode(Files.readString(arquivo).trim());
            Files.createDirectories(arquivo.getParent());
            byte[] nova = new byte[32];
            RANDOM.nextBytes(nova);
            Files.writeString(arquivo, Base64.getEncoder().encodeToString(nova));
            try {
                Files.setPosixFilePermissions(arquivo, PosixFilePermissions.fromString("rw-------"));
            } catch (UnsupportedOperationException e) {
                // Windows (desenvolvimento): sem permissões POSIX
            }
            log.warn("APP_CHAVE_CRIPTO não definida: chave gerada em {}. Faça backup dela junto com o banco.", arquivo);
            return nova;
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível ler/criar a chave de criptografia", e);
        }
    }
}
