#!/usr/bin/env bash
# Teste de fumaça da stack completa (frontend + backend + banco) já em execução.
# Usado no CI e localmente:  ./scripts/teste-fumaca.sh [URL]   (padrão http://localhost:3000)
# Variáveis: ADMIN_EMAIL, ADMIN_SENHA (para testar o login do painel)
set -uo pipefail

URL="${1:-http://localhost:3000}"
JAR="$(mktemp)"
falhas=0

ok()    { printf '  \033[32m✔\033[0m %s\n' "$1"; }
falha() { printf '  \033[31m✘\033[0m %s\n' "$1"; falhas=$((falhas + 1)); }

# status HTTP de uma requisição (args extras repassados ao curl)
status() { curl -s -o /dev/null -w '%{http_code}' -m 60 "$@"; }

espera() {
  local codigo
  for _ in $(seq 1 60); do
    codigo=$(status "$URL/saude")
    [ "$codigo" = 200 ] && return 0
    sleep 3
  done
  return 1
}

esperado() { # descrição, status esperado, args do curl...
  local desc="$1" esp="$2"; shift 2
  local obtido
  obtido=$(status "$@")
  if [ "$obtido" = "$esp" ]; then ok "$desc ($obtido)"; else falha "$desc: esperado $esp, obtido $obtido"; fi
}

contem() { # descrição, texto, url
  if curl -s -m 60 "$3" | grep -q "$2"; then ok "$1"; else falha "$1: \"$2\" não encontrado"; fi
}

echo "Teste de fumaça em $URL"
espera || { falha "frontend não respondeu em /saude"; exit 1; }

echo "Site público"
esperado "healthcheck do frontend" 200 "$URL/saude"
esperado "página inicial" 200 "$URL/"
contem "página inicial renderiza o título" "<h1" "$URL/"
contem "dados estruturados (JSON-LD) presentes" "application/ld+json" "$URL/"
esperado "robots.txt" 200 "$URL/robots.txt"
esperado "sitemap.xml" 200 "$URL/sitemap.xml"
contem "conteúdo público da API (proxy → backend)" '"secoes"' "$URL/api/publico/conteudo"
esperado "imagem de exemplo" 200 "$URL/exemplos/casamento-por-do-sol.jpg"

echo "Área do cliente"
esperado "tela de acesso do cliente" 200 "$URL/cliente"
esperado "API do cliente sem sessão é bloqueada" 401 "$URL/api/cliente/galerias"
esperado "pedido de link sempre aceito (não revela e-mails)" 202 -X POST "$URL/api/publico/acesso/cliente/link" \
  -H 'Content-Type: application/json' -d '{"email":"ninguem@exemplo.com"}'
esperado "link de acesso inválido é recusado" 401 -X POST "$URL/api/publico/acesso/cliente/entrar" \
  -H 'Content-Type: application/json' -d '{"token":"token-invalido"}'

echo "Painel gestor"
esperado "painel sem login redireciona" 307 "$URL/painel"
esperado "tela de login do painel" 200 "$URL/painel/entrar"
esperado "API do painel sem sessão é bloqueada" 401 "$URL/api/painel/galerias"
esperado "senha errada é recusada" 401 -X POST "$URL/api/publico/acesso/painel/entrar" \
  -H 'Content-Type: application/json' -d '{"email":"teste-fumaca@exemplo.com","senha":"errada"}'
if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_SENHA:-}" ]; then
  esperado "login do painel" 200 -c "$JAR" -X POST "$URL/api/publico/acesso/painel/entrar" \
    -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"senha\":\"$ADMIN_SENHA\"}"
  esperado "API do painel com sessão" 200 -b "$JAR" "$URL/api/painel/galerias"
  esperado "tela inicial do painel com sessão" 200 -b "$JAR" "$URL/painel"
  esperado "editor do site" 200 -b "$JAR" "$URL/painel/site"
  esperado "sair do painel" 204 -b "$JAR" -X POST "$URL/api/publico/acesso/painel/sair"
else
  echo "  (login do painel não testado: defina ADMIN_EMAIL e ADMIN_SENHA)"
fi

rm -f "$JAR"
echo
if [ "$falhas" -eq 0 ]; then
  printf '\033[32mTudo certo.\033[0m\n'
else
  printf '\033[31m%d verificação(ões) falharam.\033[0m\n' "$falhas"
  exit 1
fi
