package br.com.fotografiadigital.aplicacao.galeria;

import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.aplicacao.acesso.AcessoClienteService;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.ArquivoFoto;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaDetalhe;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaResumo;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.Variante;
import br.com.fotografiadigital.dominio.NaoEncontradoException;
import br.com.fotografiadigital.dominio.RegraNegocioException;
import br.com.fotografiadigital.dominio.cliente.Cliente;
import br.com.fotografiadigital.dominio.cliente.ClienteRepository;
import br.com.fotografiadigital.dominio.galeria.FotoGaleria;
import br.com.fotografiadigital.dominio.galeria.FotoGaleriaRepository;
import br.com.fotografiadigital.dominio.galeria.Galeria;
import br.com.fotografiadigital.dominio.galeria.GaleriaRepository;
import br.com.fotografiadigital.dominio.galeria.StatusGaleria;
import br.com.fotografiadigital.dominio.galeria.TipoFoto;
import br.com.fotografiadigital.infra.armazenamento.Armazenamento;
import br.com.fotografiadigital.infra.email.EmailService;
import br.com.fotografiadigital.infra.imagem.ProcessadorImagem;

/** Operações do fotógrafo (painel) sobre clientes e galerias. */
@Service
public class GaleriaService {

    private static final Set<String> EXTENSOES = Set.of("jpg", "jpeg", "png");
    private static final DateTimeFormatter DATA_BR =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.forLanguageTag("pt-BR")).withZone(ZoneId.of("America/Maceio"));

    private final GaleriaRepository galerias;
    private final FotoGaleriaRepository fotos;
    private final ClienteRepository clientes;
    private final Armazenamento armazenamento;
    private final ProcessadorImagem processador;
    private final GaleriaConsultas consultas;
    private final AcessoClienteService acesso;
    private final EmailService email;
    private final Clock relogio;
    private final Duration retencao;
    private final String marca;
    private final String urlSite;

    public GaleriaService(GaleriaRepository galerias, FotoGaleriaRepository fotos, ClienteRepository clientes,
            Armazenamento armazenamento, ProcessadorImagem processador, GaleriaConsultas consultas,
            AcessoClienteService acesso, EmailService email, Clock relogio,
            @Value("${app.galeria.dias-retencao}") int diasRetencao,
            @Value("${app.site.marca:Davi Foto Vídeo}") String marca,
            @Value("${app.site.url-publica}") String urlSite) {
        this.galerias = galerias;
        this.fotos = fotos;
        this.clientes = clientes;
        this.armazenamento = armazenamento;
        this.processador = processador;
        this.consultas = consultas;
        this.acesso = acesso;
        this.email = email;
        this.relogio = relogio;
        this.retencao = Duration.ofDays(diasRetencao);
        this.marca = marca;
        this.urlSite = urlSite.replaceAll("/+$", "");
    }

    public record NovaGaleria(String clienteNome, String clienteEmail, String clienteTelefone, String titulo,
            Integer limiteFotos) {
    }

    // ---- consultas -----------------------------------------------------------

    @Transactional(readOnly = true)
    public List<GaleriaResumo> listar() {
        List<Galeria> todas = galerias.findAll();
        Map<UUID, Cliente> porId = clientes.findAllById(todas.stream().map(Galeria::getClienteId).toList()).stream()
                .collect(Collectors.toMap(Cliente::getId, Function.identity()));
        return todas.stream()
                .sorted(Comparator.comparing(Galeria::getCriadoEm).reversed())
                .map(g -> consultas.resumo(g, porId.get(g.getClienteId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public GaleriaDetalhe detalhar(UUID galeriaId) {
        Galeria g = buscar(galeriaId);
        return consultas.detalhe(g, clientes.findById(g.getClienteId()).orElse(null), true, true);
    }

    @Transactional(readOnly = true)
    public ArquivoFoto arquivo(UUID galeriaId, UUID fotoId, Variante variante) {
        FotoGaleria f = fotos.findByIdAndGaleriaId(fotoId, galeriaId)
                .orElseThrow(() -> new NaoEncontradoException("Foto não encontrada."));
        String relativo = switch (variante) {
            case MINIATURA -> f.getArquivoMiniatura();
            case PREVIA -> f.getArquivoPrevia() != null ? f.getArquivoPrevia() : f.getArquivoMiniatura();
            case ARQUIVO -> f.getArquivo();
        };
        if (!armazenamento.existe(relativo)) throw new NaoEncontradoException("Arquivo não disponível.");
        return new ArquivoFoto(armazenamento.resolver(relativo), f.getNomeOriginal());
    }

    // ---- criação e fotos -----------------------------------------------------

    @Transactional
    public GaleriaResumo criar(NovaGaleria nova) {
        Instant agora = relogio.instant();
        Cliente cliente = clientes.findByEmailIgnoreCase(nova.clienteEmail().trim())
                .orElseGet(() -> clientes.save(
                        new Cliente(nova.clienteNome(), nova.clienteEmail(), nova.clienteTelefone(), agora)));
        Galeria g = galerias.save(new Galeria(cliente.getId(), nova.titulo(), nova.limiteFotos(), agora));
        return consultas.resumo(g, cliente);
    }

    @Transactional
    public GaleriaDtos.FotoDto adicionarFoto(UUID galeriaId, TipoFoto tipo, String nomeOriginal, InputStream conteudo) {
        Galeria g = buscar(galeriaId);
        validarEnvio(g, tipo);
        String extensao = extensao(nomeOriginal);
        UUID id = UUID.randomUUID();
        String base = "galerias/" + g.getId() + "/";
        String arquivo = base + (tipo == TipoFoto.ORIGINAL ? "originais/" : "finais/") + id + "." + extensao;
        String miniatura = base + "miniaturas/" + id + ".jpg";
        String previa = base + "previas/" + id + ".jpg";

        long tamanho = armazenamento.salvar(arquivo, conteudo);
        BufferedImage img;
        try {
            img = processador.carregar(armazenamento.resolver(arquivo));
            processador.gerarMiniatura(img, armazenamento.resolver(miniatura));
            if (tipo == TipoFoto.ORIGINAL) processador.gerarPrevia(img, armazenamento.resolver(previa));
            else processador.gerarPreviaLimpa(img, armazenamento.resolver(previa));
        } catch (RuntimeException e) {
            armazenamento.excluir(arquivo);
            armazenamento.excluir(miniatura);
            armazenamento.excluir(previa);
            throw e;
        }
        int ordem = fotos.maiorOrdem(g.getId(), tipo) + 1;
        FotoGaleria foto = fotos.save(new FotoGaleria(id, g.getId(), tipo, nomeLimpo(nomeOriginal), arquivo, previa,
                miniatura, tamanho, img.getWidth(), img.getHeight(), ordem, relogio.instant()));
        return new GaleriaDtos.FotoDto(foto.getId(), tipo, foto.getNomeOriginal(), foto.getLargura(), foto.getAltura(),
                tamanho, false, null);
    }

    @Transactional
    public void excluirFoto(UUID galeriaId, UUID fotoId) {
        Galeria g = buscar(galeriaId);
        FotoGaleria f = fotos.findByIdAndGaleriaId(fotoId, galeriaId)
                .orElseThrow(() -> new NaoEncontradoException("Foto não encontrada."));
        if (f.getTipo() == TipoFoto.ORIGINAL && f.isSelecionada() && g.getStatus() != StatusGaleria.AGUARDANDO_SELECAO
                && g.getStatus() != StatusGaleria.CRIADA) {
            throw new RegraNegocioException("Esta foto faz parte da seleção enviada pelo cliente.");
        }
        fotos.delete(f);
        armazenamento.excluir(f.getArquivo());
        armazenamento.excluir(f.getArquivoMiniatura());
        armazenamento.excluir(f.getArquivoPrevia());
    }

    // ---- fluxo ---------------------------------------------------------------

    /** Libera a galeria para o cliente selecionar e envia o link de acesso por e-mail. */
    @Transactional
    public GaleriaResumo liberarParaSelecao(UUID galeriaId) {
        Galeria g = buscar(galeriaId);
        if (fotos.countByGaleriaIdAndTipo(g.getId(), TipoFoto.ORIGINAL) == 0) {
            throw new RegraNegocioException("Envie as fotos antes de liberar a galeria.");
        }
        g.liberarParaSelecao(relogio.instant());
        Cliente c = cliente(g);
        email.enviar(c.getEmail(), "Suas fotos estão prontas para seleção · " + marca, """
                Olá, %s!

                As fotos de "%s" já estão disponíveis. Acesse e escolha as suas favoritas:

                %s

                (o link vale por 7 dias; depois disso, peça um novo acesso em %s)

                %s
                """.formatted(c.getNome(), g.getTitulo(), acesso.gerarLinkLongo(c), urlSite + "/cliente", marca));
        return consultas.resumo(g, c);
    }

    @Transactional
    public GaleriaResumo iniciarTratamento(UUID galeriaId) {
        Galeria g = buscar(galeriaId);
        g.iniciarTratamento(relogio.instant());
        return consultas.resumo(g, cliente(g));
    }

    /** Entrega as finais: começa a contar o prazo de download e avisa o cliente. */
    @Transactional
    public GaleriaResumo entregar(UUID galeriaId) {
        Galeria g = buscar(galeriaId);
        if (fotos.countByGaleriaIdAndTipo(g.getId(), TipoFoto.FINAL) == 0) {
            throw new RegraNegocioException("Envie as fotos tratadas antes de entregar.");
        }
        g.entregar(retencao, relogio.instant());
        Cliente c = cliente(g);
        email.enviar(c.getEmail(), "Suas fotos tratadas chegaram! · " + marca, """
                Olá, %s!

                As fotos tratadas de "%s" estão prontas para download:

                %s

                Atenção: elas ficam disponíveis até %s. Depois dessa data são excluídas,
                então baixe tudo e guarde um backup.

                %s
                """.formatted(c.getNome(), g.getTitulo(), acesso.gerarLinkLongo(c), DATA_BR.format(g.getExpiraEm()), marca));
        return consultas.resumo(g, c);
    }

    @Transactional
    public void excluirGaleria(UUID galeriaId) {
        Galeria g = buscar(galeriaId);
        fotos.excluirDaGaleria(g.getId());
        galerias.delete(g);
        armazenamento.excluirPasta("galerias/" + g.getId());
    }

    // ---- auxiliares ----------------------------------------------------------

    private void validarEnvio(Galeria g, TipoFoto tipo) {
        Set<StatusGaleria> permitidos = tipo == TipoFoto.ORIGINAL
                ? EnumSet.of(StatusGaleria.CRIADA, StatusGaleria.AGUARDANDO_SELECAO)
                : EnumSet.of(StatusGaleria.SELECAO_ENVIADA, StatusGaleria.EM_TRATAMENTO, StatusGaleria.ENTREGUE);
        if (!permitidos.contains(g.getStatus())) {
            throw new RegraNegocioException(tipo == TipoFoto.ORIGINAL
                    ? "Não é possível adicionar fotos para seleção depois que o cliente enviou a escolha."
                    : "As fotos tratadas só podem ser enviadas depois da seleção do cliente.");
        }
    }

    private Galeria buscar(UUID id) {
        return galerias.findById(id).orElseThrow(() -> new NaoEncontradoException("Galeria não encontrada."));
    }

    private Cliente cliente(Galeria g) {
        return clientes.findById(g.getClienteId()).orElseThrow();
    }

    static String extensao(String nome) {
        String n = nome == null ? "" : nome.toLowerCase(Locale.ROOT);
        int ponto = n.lastIndexOf('.');
        String ext = ponto >= 0 ? n.substring(ponto + 1) : "";
        if (!EXTENSOES.contains(ext)) {
            throw new RegraNegocioException("Formato não suportado. Envie arquivos JPG ou PNG.");
        }
        return ext.equals("jpeg") ? "jpg" : ext;
    }

    /** Nome exibido/baixado: sem caminho e sem caracteres de controle. */
    static String nomeLimpo(String nome) {
        String base = nome.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}\"]", "").trim();
        return base.isEmpty() ? "foto.jpg" : base.length() > 200 ? base.substring(base.length() - 200) : base;
    }
}
