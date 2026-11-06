package br.com.fotografiadigital.infra.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envio de e-mails transacionais. Sem SMTP configurado (desenvolvimento),
 * o conteúdo vai para o log em vez de ser enviado.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String smtpHost;
    private final String remetente;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
            @Value("${spring.mail.host:}") String smtpHost,
            @Value("${app.email.remetente}") String remetente) {
        this.mailSender = mailSender;
        this.smtpHost = smtpHost;
        this.remetente = remetente;
    }

    @jakarta.annotation.PostConstruct
    void avisarSemSmtp() {
        if (!smtpConfigurado()) {
            log.warn("SMTP não configurado: e-mails (inclusive LINKS DE ACESSO de clientes) serão apenas registrados no log. "
                    + "Configure SMTP_HOST antes de usar em produção.");
        }
    }

    public boolean smtpConfigurado() {
        return smtpHost != null && !smtpHost.isBlank() && mailSender.getIfAvailable() != null;
    }

    /** @return true se enviado (ou registrado em log no modo sem SMTP) */
    public boolean enviar(String para, String assunto, String corpo) {
        if (!smtpConfigurado()) {
            log.info("[E-MAIL NÃO ENVIADO: SMTP não configurado]\nPara: {}\nAssunto: {}\n{}", para, assunto, corpo);
            return true;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(remetente);
            msg.setTo(para);
            msg.setSubject(assunto);
            msg.setText(corpo);
            mailSender.getObject().send(msg);
            return true;
        } catch (RuntimeException e) {
            log.error("Falha ao enviar e-mail para {}: {}", para, e.getMessage());
            return false;
        }
    }
}
