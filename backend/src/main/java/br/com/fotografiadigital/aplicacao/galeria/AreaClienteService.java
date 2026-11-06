package br.com.fotografiadigital.aplicacao.galeria;

import java.time.Clock;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.ArquivoFoto;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.ClienteDto;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.FotoDto;
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

/**
 * Tudo que o cliente pode fazer, sempre restrito às galerias dele.
 * Regras de visibilidade:
 * - originais: só miniatura e prévia com marca d'água (nunca o arquivo bruto);
 * - finais: download apenas com a galeria ENTREGUE e dentro do prazo.
 */
@Service
public class AreaClienteService {

    private static final EnumSet<StatusGaleria> VISIVEIS = EnumSet.complementOf(EnumSet.of(StatusGaleria.CRIADA));

    private final GaleriaRepository galerias;
    private final FotoGaleriaRepository fotos;
    private final ClienteRepository clientes;
    private final Armazenamento armazenamento;
    private final GaleriaConsultas consultas;
    private final Clock relogio;

    public AreaClienteService(GaleriaRepository galerias, FotoGaleriaRepository fotos, ClienteRepository clientes,
            Armazenamento armazenamento, GaleriaConsultas consultas, Clock relogio) {
        this.galerias = galerias;
        this.fotos = fotos;
        this.clientes = clientes;
        this.armazenamento = armazenamento;
        this.consultas = consultas;
        this.relogio = relogio;
    }

    @Transactional(readOnly = true)
    public ClienteDto eu(UUID clienteId) {
        Cliente c = clientes.findById(clienteId).orElseThrow(() -> new NaoEncontradoException("Cliente não encontrado."));
        return new ClienteDto(c.getId(), c.getNome(), c.getEmail(), c.getTelefone());
    }

    @Transactional(readOnly = true)
    public List<GaleriaResumo> listar(UUID clienteId) {
        return galerias.findByClienteIdAndStatusInOrderByCriadoEmDesc(clienteId, VISIVEIS).stream()
                .map(g -> consultas.resumo(g, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public GaleriaDetalhe detalhar(UUID clienteId, UUID galeriaId) {
        Galeria g = buscar(clienteId, galeriaId);
        boolean finais = g.finaisDisponiveis(relogio.instant());
        boolean originais = g.getStatus() != StatusGaleria.EXPIRADA && !finais;
        return consultas.detalhe(g, null, originais, finais);
    }

    @Transactional
    public FotoDto marcar(UUID clienteId, UUID galeriaId, UUID fotoId, boolean selecionada, String comentario) {
        Galeria g = buscar(clienteId, galeriaId);
        if (!g.permiteSelecao()) {
            throw new RegraNegocioException("A seleção desta galeria já foi enviada.");
        }
        FotoGaleria f = foto(g, fotoId);
        if (f.getTipo() != TipoFoto.ORIGINAL) throw new NaoEncontradoException("Foto não encontrada.");
        f.marcar(selecionada, comentario);
        return new FotoDto(f.getId(), f.getTipo(), f.getNomeOriginal(), f.getLargura(), f.getAltura(),
                f.getTamanhoBytes(), f.isSelecionada(), f.getComentario());
    }

    @Transactional
    public GaleriaResumo enviarSelecao(UUID clienteId, UUID galeriaId, String observacao) {
        Galeria g = buscar(clienteId, galeriaId);
        if (fotos.countByGaleriaIdAndTipoAndSelecionadaTrue(g.getId(), TipoFoto.ORIGINAL) == 0) {
            throw new RegraNegocioException("Selecione pelo menos uma foto antes de enviar.");
        }
        g.enviarSelecao(observacao, relogio.instant());
        return consultas.resumo(g, null);
    }

    @Transactional(readOnly = true)
    public ArquivoFoto arquivo(UUID clienteId, UUID galeriaId, UUID fotoId, Variante variante) {
        Galeria g = buscar(clienteId, galeriaId);
        if (g.getStatus() == StatusGaleria.EXPIRADA) throw new NaoEncontradoException("Galeria expirada.");
        FotoGaleria f = foto(g, fotoId);
        String relativo = switch (variante) {
            case MINIATURA -> f.getArquivoMiniatura();
            case PREVIA -> {
                if (f.getTipo() == TipoFoto.ORIGINAL) yield f.getArquivoPrevia();
                FotoGaleria fin = exigirFinalDisponivel(g, f);
                yield fin.getArquivoPrevia() != null ? fin.getArquivoPrevia() : fin.getArquivoMiniatura();
            }
            case ARQUIVO -> exigirFinalDisponivel(g, f).getArquivo();
        };
        if (!armazenamento.existe(relativo)) throw new NaoEncontradoException("Arquivo não disponível.");
        return new ArquivoFoto(armazenamento.resolver(relativo), f.getNomeOriginal());
    }

    /** Fotos finais para o ZIP (mesmas regras do download individual). */
    @Transactional(readOnly = true)
    public List<ArquivoFoto> finaisParaZip(UUID clienteId, UUID galeriaId) {
        Galeria g = buscar(clienteId, galeriaId);
        if (!g.finaisDisponiveis(relogio.instant())) throw new NaoEncontradoException("Fotos finais indisponíveis.");
        return fotos.findByGaleriaIdAndTipoOrderByOrdemAscCriadoEmAsc(g.getId(), TipoFoto.FINAL).stream()
                .filter(f -> armazenamento.existe(f.getArquivo()))
                .map(f -> new ArquivoFoto(armazenamento.resolver(f.getArquivo()), f.getNomeOriginal()))
                .toList();
    }

    @Transactional(readOnly = true)
    public String tituloGaleria(UUID clienteId, UUID galeriaId) {
        return buscar(clienteId, galeriaId).getTitulo();
    }

    private FotoGaleria exigirFinalDisponivel(Galeria g, FotoGaleria f) {
        if (f.getTipo() != TipoFoto.FINAL || !g.finaisDisponiveis(relogio.instant())) {
            throw new NaoEncontradoException("Foto não disponível para download.");
        }
        return f;
    }

    private Galeria buscar(UUID clienteId, UUID galeriaId) {
        return galerias.findByIdAndClienteId(galeriaId, clienteId)
                .filter(g -> g.getStatus().visivelAoCliente())
                .orElseThrow(() -> new NaoEncontradoException("Galeria não encontrada."));
    }

    private FotoGaleria foto(Galeria g, UUID fotoId) {
        return fotos.findByIdAndGaleriaId(fotoId, g.getId())
                .orElseThrow(() -> new NaoEncontradoException("Foto não encontrada."));
    }
}
