package br.com.fotografiadigital.aplicacao.galeria;

import java.time.Clock;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.aplicacao.acesso.AcessoClienteService;
import br.com.fotografiadigital.aplicacao.acesso.SessaoService;
import br.com.fotografiadigital.dominio.galeria.FotoGaleriaRepository;
import br.com.fotografiadigital.dominio.galeria.Galeria;
import br.com.fotografiadigital.dominio.galeria.GaleriaRepository;
import br.com.fotografiadigital.dominio.galeria.StatusGaleria;
import br.com.fotografiadigital.infra.armazenamento.Armazenamento;

/**
 * Rotina diária: exclui os arquivos das galerias entregues cujo prazo (60 dias)
 * venceu. A galeria fica como registro (status EXPIRADA). Também limpa sessões
 * e links de acesso vencidos.
 */
@Component
public class ExpiracaoGalerias {

    private static final Logger log = LoggerFactory.getLogger(ExpiracaoGalerias.class);

    private final GaleriaRepository galerias;
    private final FotoGaleriaRepository fotos;
    private final Armazenamento armazenamento;
    private final SessaoService sessoes;
    private final AcessoClienteService acesso;
    private final Clock relogio;

    public ExpiracaoGalerias(GaleriaRepository galerias, FotoGaleriaRepository fotos, Armazenamento armazenamento,
            SessaoService sessoes, AcessoClienteService acesso, Clock relogio) {
        this.galerias = galerias;
        this.fotos = fotos;
        this.armazenamento = armazenamento;
        this.sessoes = sessoes;
        this.acesso = acesso;
        this.relogio = relogio;
    }

    @Scheduled(cron = "${app.galeria.cron-expiracao:0 0 3 * * *}", zone = "America/Maceio")
    public void executarAgendado() {
        int expiradas = executar();
        int limpas = sessoes.limparExpiradas() + acesso.limparTokensExpirados();
        log.info("Rotina de expiração: {} galeria(s) expirada(s), {} sessão(ões)/link(s) removido(s)", expiradas, limpas);
    }

    @Transactional
    public int executar() {
        Instant agora = relogio.instant();
        int total = 0;
        for (Galeria g : galerias.findByStatusAndExpiraEmBefore(StatusGaleria.ENTREGUE, agora)) {
            armazenamento.excluirPasta("galerias/" + g.getId());
            fotos.excluirDaGaleria(g.getId());
            g.expirar(agora);
            total++;
            log.info("Galeria {} expirada: arquivos excluídos", g.getId());
        }
        return total;
    }
}
