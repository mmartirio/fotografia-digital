#!/usr/bin/env bash
# Inicializa o projeto Fotografia Digital (Linux/macOS/servidor).
#   ./iniciar.sh              sobe tudo (com build)
#   ./iniciar.sh --dev        frontend em hot reload (next dev)
#   ./iniciar.sh --sem-build  sobe sem reconstruir imagens
#   ./iniciar.sh --logs       sobe e acompanha os logs
#   ./iniciar.sh --parar      para os containers
#   ./iniciar.sh --resetar    para e APAGA banco e fotos (pede confirmação)
set -euo pipefail
cd "$(dirname "$0")"

TIMEOUT=${TIMEOUT:-300}
BUILD="--build"; LOGS=0; DEV=0; ACAO="subir"
for arg in "$@"; do
  case "$arg" in
    --dev) DEV=1 ;;
    --sem-build) BUILD="" ;;
    --logs) LOGS=1 ;;
    --parar) ACAO="parar" ;;
    --resetar) ACAO="resetar" ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "Opção desconhecida: $arg"; exit 1 ;;
  esac
done

# Modo dev: todos os "docker compose" passam a incluir o override de hot reload
if [ "$DEV" = 1 ]; then export COMPOSE_FILE="docker-compose.yml:docker-compose.dev.yml"; else unset COMPOSE_FILE; fi

passo() { printf '\n\033[36m==> %s\033[0m\n' "$1"; }
ok()    { printf '    \033[32m[ok]\033[0m %s\n' "$1"; }
falhar(){ printf '\n\033[31m[ERRO]\033[0m %s\n' "$1"; exit 1; }

porta_ocupada() {
  if command -v ss >/dev/null; then ss -ltn "sport = :$1" | grep -q LISTEN
  elif command -v lsof >/dev/null; then lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null
  else return 1; fi
}

passo "Verificando Docker"
command -v docker >/dev/null || falhar "Docker não encontrado."
docker info >/dev/null 2>&1 || falhar "O Docker não está respondendo. Inicie o serviço e tente de novo."
ok "Docker rodando"

if [ "$ACAO" = "parar" ]; then
  docker compose down; ok "Containers parados (dados preservados)"; exit 0
fi
if [ "$ACAO" = "resetar" ]; then
  printf '\n\033[31mATENÇÃO: isso apaga o BANCO e TODAS AS FOTOS.\033[0m\n'
  read -r -p "Digite RESETAR para confirmar: " r
  [ "$r" = "RESETAR" ] || { echo "Cancelado."; exit 0; }
  docker compose down -v; ok "Containers e volumes removidos"; exit 0
fi

passo "Verificando .env"
if [ ! -f .env ]; then
  [ -f .env.example ] || falhar ".env.example não encontrado."
  # Senha nova não bateria com a de um banco já inicializado
  if docker volume ls -q | grep -qx "fotografia-digital_pgdata"; then
    falhar "Sem .env, mas o banco já existe (volume pgdata). Restaure o .env com a senha original ou rode --resetar."
  fi
  SENHA=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' | cut -c1-24)
  sed "s/^DB_PASSWORD=.*/DB_PASSWORD=$SENHA/" .env.example > .env
  chmod 600 .env
  ok ".env criado com senha aleatória para o banco"
else
  ok ".env já existe"
fi
ler_env() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- || true; }
PORTA_DB=$(ler_env DB_PORTA_LOCAL); PORTA_DB=${PORTA_DB:-5434}
PORTA_FRONT=$(ler_env FRONTEND_PORTA); PORTA_FRONT=${PORTA_FRONT:-3000}

passo "Verificando portas"
if [ -n "$(docker compose ps -q 2>/dev/null)" ]; then
  ok "Projeto já está rodando"
else
  porta_ocupada "$PORTA_DB" && falhar "Porta $PORTA_DB (DB_PORTA_LOCAL) em uso. Altere no .env."
  porta_ocupada "$PORTA_FRONT" && falhar "Porta $PORTA_FRONT (FRONTEND_PORTA) em uso. Altere no .env."
  ok "Portas livres (banco $PORTA_DB, site $PORTA_FRONT)"
fi

passo "Subindo containers"
# shellcheck disable=SC2086
docker compose up -d $BUILD || falhar "Falha ao subir os containers."

passo "Aguardando containers ficarem saudáveis (até ${TIMEOUT}s)"
inicio=$(date +%s)
while true; do
  estados=$(docker compose ps -q | xargs -r docker inspect --format '{{.Name}}={{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}')
  if echo "$estados" | grep -Eq '=(unhealthy|exited|dead)$'; then
    docker compose ps; falhar "Container com problema. Veja: docker compose logs <servico>"
  fi
  if [ -n "$estados" ] && ! echo "$estados" | grep -vq '=healthy$'; then break; fi
  [ $(( $(date +%s) - inicio )) -gt "$TIMEOUT" ] && { docker compose ps; falhar "Tempo esgotado."; }
  sleep 3
done
ok "Todos os containers saudáveis"

echo
docker compose ps --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'
cat <<EOF

  Site:    http://localhost:$PORTA_FRONT
  Saúde:   http://localhost:$PORTA_FRONT/saude
  Banco:   localhost:$PORTA_DB (usuário/senha no .env)

$( [ "$DEV" = 1 ] && echo "  Modo:    DESENVOLVIMENTO (hot reload). Voltar a produção: ./iniciar.sh" )
  Parar:   ./iniciar.sh --parar
  Logs:    docker compose logs -f

EOF
[ "$LOGS" = 1 ] && docker compose logs -f
exit 0
