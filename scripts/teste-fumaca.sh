#!/usr/bin/env bash
# Teste de fumaça do site em execução (next start / next dev / deploy de preview).
# Uso:  ./scripts/teste-fumaca.sh [URL]   (padrão http://localhost:3000)
# Variáveis: ADMIN_EMAIL, ADMIN_SENHA (para testar o painel logado)
set -uo pipefail

URL="${1:-http://localhost:3000}"
ORIGEM="$URL"
JAR="$(mktemp)"
PNG="$(mktemp)"
falhas=0

ok()    { printf '  \033[32m✔\033[0m %s\n' "$1"; }
falha() { printf '  \033[31m✘\033[0m %s\n' "$1"; falhas=$((falhas + 1)); }

status() { curl -s -o /dev/null -w '%{http_code}' -m 60 "$@"; }

espera() {
  for _ in $(seq 1 60); do
    [ "$(status "$URL/saude")" = 200 ] && return 0
    sleep 2
  done
  return 1
}

esperado() { # descrição, status esperado, args do curl...
  local desc="$1" esp="$2"; shift 2
  local obtido
  obtido=$(status "$@")
  if [ "$obtido" = "$esp" ]; then ok "$desc ($obtido)"; else falha "$desc: esperado $esp, obtido $obtido"; fi
}

contem() { # descrição, texto, args do curl...
  local desc="$1" texto="$2"; shift 2
  if curl -s -m 60 "$@" | grep -q -- "$texto"; then ok "$desc"; else falha "$desc: \"$texto\" não encontrado"; fi
}

echo "Teste de fumaça em $URL"
espera || { falha "site não respondeu em /saude"; exit 1; }

echo "Site público"
esperado "healthcheck" 200 "$URL/saude"
esperado "página inicial" 200 "$URL/"
contem "página inicial renderiza o título" "<h1" "$URL/"
contem "dados estruturados (JSON-LD)" "application/ld+json" "$URL/"
contem "cabeçalho anti-iframe" "frame-ancestors 'none'" -I "$URL/"
esperado "robots.txt" 200 "$URL/robots.txt"
esperado "sitemap.xml" 200 "$URL/sitemap.xml"
esperado "imagem de exemplo" 200 "$URL/exemplos/casamento-por-do-sol.jpg"
esperado "área do cliente não existe mais" 404 "$URL/cliente"

echo "Painel gestor"
esperado "painel sem login redireciona" 307 "$URL/painel"
esperado "tela de login" 200 "$URL/painel/entrar"
esperado "API sem sessão é bloqueada" 401 "$URL/api/painel/eu"
esperado "senha errada é recusada" 401 -X POST "$URL/api/publico/acesso/painel/entrar" \
  -H "Origin: $ORIGEM" -H 'Content-Type: application/json' -d '{"email":"teste-fumaca@exemplo.com","senha":"errada"}'
esperado "requisição de outro site é recusada" 403 -X POST "$URL/api/publico/acesso/painel/entrar" \
  -H 'Origin: https://site-malicioso.example' -H 'Content-Type: application/json' -d '{"email":"a@b.c","senha":"x"}'

if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_SENHA:-}" ]; then
  esperado "login do painel" 200 -c "$JAR" -X POST "$URL/api/publico/acesso/painel/entrar" \
    -H "Origin: $ORIGEM" -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"senha\":\"$ADMIN_SENHA\"}"
  esperado "API do painel com sessão" 200 -b "$JAR" "$URL/api/painel/eu"
  esperado "tela inicial do painel" 200 -b "$JAR" "$URL/painel"
  esperado "editor do site" 200 -b "$JAR" "$URL/painel/site"
  esperado "tela do portfólio" 200 -b "$JAR" "$URL/painel/portfolio"
  esperado "tela da conta" 200 -b "$JAR" "$URL/painel/conta"

  # edição de texto aparece no site na hora (revalidação do cache)
  MARCA="Fumaca $(date +%s)"
  esperado "salvar texto do topo" 204 -b "$JAR" -X PUT "$URL/api/painel/conteudo/hero" \
    -H "Origin: $ORIGEM" -H 'Content-Type: application/json' -d "{\"titulo\":\"$MARCA\"}"
  contem "texto salvo aparece no site" "$MARCA" "$URL/"
  esperado "restaurar texto do topo" 204 -b "$JAR" -X DELETE -H "Origin: $ORIGEM" "$URL/api/painel/conteudo/hero"
  esperado "seção desconhecida é recusada" 404 -b "$JAR" -X PUT "$URL/api/painel/conteudo/menu" \
    -H "Origin: $ORIGEM" -H 'Content-Type: application/json' -d '{}'

  # upload: PNG 1x1 válido entra; arquivo falso é recusado
  printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' | base64 -d > "$PNG"
  RESP=$(curl -s -m 60 -b "$JAR" -H "Origin: $ORIGEM" -F "arquivo=@-;filename=foto.png;type=image/png" -F categoria=ensaio -F alt=teste "$URL/api/painel/portfolio" < "$PNG")
  ID=$(printf '%s' "$RESP" | sed -n 's/.*"id":"\([0-9a-f-]*\)".*/\1/p')
  if [ -n "$ID" ]; then ok "envio de foto ao portfólio"; else falha "envio de foto ao portfólio: $RESP"; fi
  SRC=$(printf '%s' "$RESP" | sed -n 's/.*"src":"\([^"]*\)".*/\1/p')
  [ -n "$SRC" ] && esperado "foto enviada é servida" 200 "$URL$SRC"
  contem "foto aparece no portfólio do site" "$(basename "${SRC:-nada}")" "$URL/"
  esperado "imagem inexistente dá 404" 404 "$URL/imagens/portfolio/00000000-0000-0000-0000-000000000000.png"
  printf 'nao sou imagem' > "$PNG"
  esperado "arquivo que não é imagem é recusado" 422 -b "$JAR" -H "Origin: $ORIGEM" -F "arquivo=@-;filename=falso.png;type=image/png" "$URL/api/painel/imagens" < "$PNG"
  [ -n "$ID" ] && esperado "excluir foto do portfólio" 204 -b "$JAR" -X DELETE -H "Origin: $ORIGEM" "$URL/api/painel/portfolio/$ID"

  esperado "sair do painel" 204 -b "$JAR" -X POST -H "Origin: $ORIGEM" "$URL/api/publico/acesso/painel/sair"
else
  echo "  (painel logado não testado: defina ADMIN_EMAIL e ADMIN_SENHA)"
fi

rm -f "$JAR" "$PNG"
echo
if [ "$falhas" -eq 0 ]; then
  printf '\033[32mTudo certo.\033[0m\n'
else
  printf '\033[31m%d verificação(ões) falharam.\033[0m\n' "$falhas"
  exit 1
fi
