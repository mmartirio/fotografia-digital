package br.com.fotografiadigital.infra.demo;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import br.com.fotografiadigital.aplicacao.galeria.AreaClienteService;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.FotoDto;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaResumo;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaService;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaService.NovaGaleria;
import br.com.fotografiadigital.dominio.cliente.ClienteRepository;
import br.com.fotografiadigital.dominio.galeria.TipoFoto;

/**
 * SOMENTE DESENVOLVIMENTO (perfil "demo"): cria um cliente de teste com duas galerias
 * a partir das fotos de exemplo, para testar a área do cliente sem o painel.
 *   cliente@exemplo.com · "Ensaio de casal" aguardando seleção · "Casamento" entregue
 */
@Component
@Profile("demo")
public class DadosDemonstracao implements ApplicationRunner {

    public static final String EMAIL = "cliente@exemplo.com";
    private static final Logger log = LoggerFactory.getLogger(DadosDemonstracao.class);

    private final GaleriaService galerias;
    private final AreaClienteService areaCliente;
    private final ClienteRepository clientes;
    private final Path pastaFotos;

    public DadosDemonstracao(GaleriaService galerias, AreaClienteService areaCliente, ClienteRepository clientes,
            @Value("${app.demo.fotos-dir:/demo}") String pastaFotos) {
        this.galerias = galerias;
        this.areaCliente = areaCliente;
        this.clientes = clientes;
        this.pastaFotos = Path.of(pastaFotos);
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        log.warn("MODO DEMONSTRAÇÃO ATIVO (perfil demo): cria dados de teste e mostra links de acesso na tela. NÃO USE EM PRODUÇÃO.");
        if (clientes.findByEmailIgnoreCase(EMAIL).isPresent()) return;
        if (!Files.isDirectory(pastaFotos)) {
            log.warn("Demonstração: pasta {} não encontrada; dados não criados", pastaFotos);
            return;
        }
        List<Path> ensaio = fotos("ensaio-", "familia-", "gestante-");
        List<Path> casamento = fotos("casamento-");

        // 1) Galeria aguardando seleção
        GaleriaResumo g1 = galerias.criar(new NovaGaleria("Cliente Demonstração", EMAIL, "(79) 90000-0000",
                "Ensaio de casal e família", 8));
        enviar(g1.id(), TipoFoto.ORIGINAL, ensaio);
        galerias.liberarParaSelecao(g1.id());

        // 2) Galeria já entregue (seleção feita, finais disponíveis por 60 dias)
        GaleriaResumo g2 = galerias.criar(new NovaGaleria("Cliente Demonstração", EMAIL, null, "Casamento", 6));
        List<FotoDto> originais = enviar(g2.id(), TipoFoto.ORIGINAL, casamento);
        galerias.liberarParaSelecao(g2.id());
        UUID cliente = clientes.findByEmailIgnoreCase(EMAIL).orElseThrow().getId();
        originais.stream().limit(6).forEach(f -> areaCliente.marcar(cliente, g2.id(), f.id(), true, null));
        areaCliente.enviarSelecao(cliente, g2.id(), "Amei todas! Pode caprichar na do beijo.");
        galerias.iniciarTratamento(g2.id());
        enviar(g2.id(), TipoFoto.FINAL, casamento.subList(0, Math.min(6, casamento.size())));
        galerias.entregar(g2.id());

        log.info("Demonstração criada: entre na área do cliente com {}", EMAIL);
    }

    private List<Path> fotos(String... prefixos) throws IOException {
        try (Stream<Path> s = Files.list(pastaFotos)) {
            return s.filter(p -> p.toString().endsWith(".jpg"))
                    .filter(p -> Stream.of(prefixos).anyMatch(px -> p.getFileName().toString().startsWith(px)))
                    .sorted()
                    .toList();
        }
    }

    private List<FotoDto> enviar(UUID galeria, TipoFoto tipo, List<Path> arquivos) throws IOException {
        List<FotoDto> enviadas = new java.util.ArrayList<>();
        for (Path p : arquivos) {
            try (InputStream in = Files.newInputStream(p)) {
                enviadas.add(galerias.adicionarFoto(galeria, tipo, p.getFileName().toString(), in));
            }
        }
        return enviadas;
    }
}
