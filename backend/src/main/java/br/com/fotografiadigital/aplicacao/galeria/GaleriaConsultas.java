package br.com.fotografiadigital.aplicacao.galeria;

import java.util.List;

import org.springframework.stereotype.Component;

import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.ClienteDto;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.FotoDto;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaDetalhe;
import br.com.fotografiadigital.aplicacao.galeria.GaleriaDtos.GaleriaResumo;
import br.com.fotografiadigital.dominio.cliente.Cliente;
import br.com.fotografiadigital.dominio.galeria.FotoGaleria;
import br.com.fotografiadigital.dominio.galeria.FotoGaleriaRepository;
import br.com.fotografiadigital.dominio.galeria.Galeria;
import br.com.fotografiadigital.dominio.galeria.TipoFoto;

/** Monta resumos/detalhes de galeria a partir das entidades. */
@Component
class GaleriaConsultas {

    private final FotoGaleriaRepository fotos;

    GaleriaConsultas(FotoGaleriaRepository fotos) {
        this.fotos = fotos;
    }

    GaleriaResumo resumo(Galeria g, Cliente cliente) {
        long originais = fotos.countByGaleriaIdAndTipo(g.getId(), TipoFoto.ORIGINAL);
        long finais = fotos.countByGaleriaIdAndTipo(g.getId(), TipoFoto.FINAL);
        long selecionadas = fotos.countByGaleriaIdAndTipoAndSelecionadaTrue(g.getId(), TipoFoto.ORIGINAL);
        TipoFoto tipoCapa = finais > 0 ? TipoFoto.FINAL : TipoFoto.ORIGINAL;
        var capa = fotos.findByGaleriaIdAndTipoOrderByOrdemAscCriadoEmAsc(g.getId(), tipoCapa).stream().findFirst();
        ClienteDto clienteDto = cliente == null ? null
                : new ClienteDto(cliente.getId(), cliente.getNome(), cliente.getEmail(), cliente.getTelefone());
        return new GaleriaResumo(g.getId(), g.getTitulo(), g.getStatus(), g.getLimiteFotos(), originais, selecionadas,
                finais, g.getCriadoEm(), g.getSelecaoEnviadaEm(), g.getEntregueEm(), g.getExpiraEm(),
                capa.map(FotoGaleria::getId).orElse(null), clienteDto);
    }

    GaleriaDetalhe detalhe(Galeria g, Cliente cliente, boolean incluirOriginais, boolean incluirFinais) {
        List<FotoDto> originais = incluirOriginais ? listar(g, TipoFoto.ORIGINAL) : List.of();
        List<FotoDto> finais = incluirFinais ? listar(g, TipoFoto.FINAL) : List.of();
        return new GaleriaDetalhe(resumo(g, cliente), g.getObservacaoCliente(), originais, finais);
    }

    private List<FotoDto> listar(Galeria g, TipoFoto tipo) {
        return fotos.findByGaleriaIdAndTipoOrderByOrdemAscCriadoEmAsc(g.getId(), tipo).stream()
                .map(f -> new FotoDto(f.getId(), f.getTipo(), f.getNomeOriginal(), f.getLargura(), f.getAltura(),
                        f.getTamanhoBytes(), f.isSelecionada(), f.getComentario()))
                .toList();
    }
}
