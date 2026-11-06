package br.com.fotografiadigital.dominio.acesso;

/** Cada tipo usa seu próprio cookie e papel no Spring Security. */
public enum TipoSessao {
    CLIENTE("fd_sessao", "ROLE_CLIENTE"),
    ADMIN("fd_painel", "ROLE_ADMIN");

    private final String cookie;
    private final String papel;

    TipoSessao(String cookie, String papel) {
        this.cookie = cookie;
        this.papel = papel;
    }

    public String cookie() { return cookie; }
    public String papel() { return papel; }
}
