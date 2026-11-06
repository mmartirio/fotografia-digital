package br.com.fotografiadigital.aplicacao.site;

import java.io.InputStream;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fotografiadigital.aplicacao.site.ImagensSiteService.ImagemSalva;
import br.com.fotografiadigital.dominio.NaoEncontradoException;
import br.com.fotografiadigital.dominio.portfolio.FotoPortfolio;
import br.com.fotografiadigital.dominio.portfolio.FotoPortfolioRepository;

@Service
public class PortfolioService {

    public record FotoPortfolioDto(UUID id, String src, String miniatura, int largura, int altura, String alt,
            String categoria, boolean destaque, int ordem) {
    }

    private final FotoPortfolioRepository repo;
    private final ImagensSiteService imagens;
    private final Clock relogio;

    public PortfolioService(FotoPortfolioRepository repo, ImagensSiteService imagens, Clock relogio) {
        this.repo = repo;
        this.imagens = imagens;
        this.relogio = relogio;
    }

    @Transactional(readOnly = true)
    public List<FotoPortfolioDto> listar() {
        return repo.findAllByOrderByOrdemAscCriadoEmAsc().stream().map(PortfolioService::dto).toList();
    }

    @Transactional
    public FotoPortfolioDto adicionar(String categoria, String alt, String nomeOriginal, InputStream conteudo) {
        ImagemSalva img = imagens.salvar("portfolio", nomeOriginal, conteudo);
        FotoPortfolio f = new FotoPortfolio(img.id(), limpar(categoria), img.arquivo(), img.miniatura(), img.largura(),
                img.altura(), textoAlt(alt, nomeOriginal), repo.maiorOrdem() + 1, relogio.instant());
        return dto(repo.save(f));
    }

    @Transactional
    public FotoPortfolioDto editar(UUID id, String categoria, String alt, boolean destaque) {
        FotoPortfolio f = buscar(id);
        f.editar(limpar(categoria), textoAlt(alt, f.getAlt()), destaque);
        return dto(f);
    }

    /** Reordena conforme a lista de ids recebida (ids ausentes vão para o fim). */
    @Transactional
    public void ordenar(List<UUID> ids) {
        List<FotoPortfolio> todas = repo.findAllByOrderByOrdemAscCriadoEmAsc();
        int ordem = 1;
        for (UUID id : ids) {
            for (FotoPortfolio f : todas) {
                if (f.getId().equals(id)) f.ordenar(ordem++);
            }
        }
        for (FotoPortfolio f : todas) {
            if (!ids.contains(f.getId())) f.ordenar(ordem++);
        }
    }

    @Transactional
    public void excluir(UUID id) {
        FotoPortfolio f = buscar(id);
        repo.delete(f);
        imagens.excluir(f.getArquivo(), f.getArquivoMiniatura());
    }

    private FotoPortfolio buscar(UUID id) {
        return repo.findById(id).orElseThrow(() -> new NaoEncontradoException("Foto não encontrada."));
    }

    private static FotoPortfolioDto dto(FotoPortfolio f) {
        return new FotoPortfolioDto(f.getId(), ImagensSiteService.urlPublica(f.getArquivo()),
                ImagensSiteService.urlPublica(f.getArquivoMiniatura()), f.getLargura(), f.getAltura(), f.getAlt(),
                f.getCategoria(), f.isDestaque(), f.getOrdem());
    }

    private static String limpar(String s) {
        return s == null ? "" : s.trim();
    }

    private static String textoAlt(String alt, String reserva) {
        String a = limpar(alt);
        if (a.isEmpty()) a = limpar(reserva).replaceAll("\\.[A-Za-z]+$", "").replace('-', ' ').replace('_', ' ');
        return a.length() > 200 ? a.substring(0, 200) : a;
    }
}
