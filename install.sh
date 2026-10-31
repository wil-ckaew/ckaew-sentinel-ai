#!/usr/bin/env bash
set -Eeuo pipefail

# Instalador oficial do CKAEW Sentinel AI
# Não remove bancos de dados, volumes, .env ou backups.

APP_NAME="CKAEW Sentinel AI"
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE=""
CHECK_ONLY=false

log() {
    printf '\033[1;34m[INFO]\033[0m %s\n' "$*"
}

warn() {
    printf '\033[1;33m[AVISO]\033[0m %s\n' "$*" >&2
}

fail() {
    printf '\033[1;31m[ERRO]\033[0m %s\n' "$*" >&2
    exit 1
}

usage() {
    cat <<'HELP'
CKAEW Sentinel AI - Instalador

Uso:
  ./install.sh
  ./install.sh --check-only
  ./install.sh --help

Opções:
  --check-only   Verifica dependências e arquivos sem iniciar containers.
  --help         Exibe esta ajuda.
HELP
}

for arg in "$@"; do
    case "$arg" in
        --check-only)
            CHECK_ONLY=true
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            fail "Opção desconhecida: $arg"
            ;;
    esac
done

cd "$ROOT_DIR"

log "Preparando instalação do ${APP_NAME}..."
log "Diretório: ${ROOT_DIR}"

# Localiza o arquivo Docker Compose.
for candidate in \
    docker-compose.yml \
    docker-compose.yaml \
    compose.yml \
    compose.yaml
do
    if [[ -f "$ROOT_DIR/$candidate" ]]; then
        COMPOSE_FILE="$ROOT_DIR/$candidate"
        break
    fi
done

[[ -n "$COMPOSE_FILE" ]] ||
    fail "Arquivo Docker Compose não encontrado na raiz do projeto."

# Verifica a estrutura do backend Rust.
[[ -f "$ROOT_DIR/backend/Cargo.toml" ]] ||
    fail "backend/Cargo.toml não encontrado."

[[ -f "$ROOT_DIR/backend/src/main.rs" ]] ||
    fail "backend/src/main.rs não encontrado."

[[ -d "$ROOT_DIR/backend/migrations" ]] ||
    fail "Diretório backend/migrations não encontrado."

# Verifica dependências.
command -v git >/dev/null 2>&1 ||
    fail "Git não está instalado."

command -v docker >/dev/null 2>&1 ||
    fail "Docker não está instalado."

docker compose version >/dev/null 2>&1 ||
    fail "Docker Compose V2 não está disponível."

docker info >/dev/null 2>&1 ||
    fail "Não foi possível acessar o Docker. Verifique se o serviço está ativo e se seu usuário possui permissão."

# Protege as configurações.
# Nunca sobrescreve um .env existente.
if [[ ! -f "$ROOT_DIR/.env" ]]; then

    ENV_TEMPLATE=""

    for candidate in .env.example .env.sample .env.template; do
        if [[ -f "$ROOT_DIR/$candidate" ]]; then
            ENV_TEMPLATE="$candidate"
            break
        fi
    done

    if [[ -n "$ENV_TEMPLATE" ]]; then
        warn "Arquivo .env não encontrado."
        cp -- "$ROOT_DIR/$ENV_TEMPLATE" "$ROOT_DIR/.env"
        chmod 600 "$ROOT_DIR/.env"

        warn "Foi criado um .env a partir de ${ENV_TEMPLATE}."
        warn "Revise e preencha as credenciais antes de continuar."

        fail "Edite o arquivo .env e execute ./install.sh novamente."
    else
        fail "Arquivo .env não encontrado. Configure as variáveis de ambiente antes de instalar."
    fi
fi

chmod 600 "$ROOT_DIR/.env"

COMPOSE=(docker compose -f "$COMPOSE_FILE")

# Valida a configuração antes de iniciar qualquer serviço.
log "Validando configuração Docker Compose..."

"${COMPOSE[@]}" config --quiet ||
    fail "Configuração Docker Compose inválida. Verifique o .env e o arquivo Compose."

log "Verificações concluídas."

printf '\n'
printf 'Projeto: %s\n' "$APP_NAME"
printf 'Compose: %s\n' "${COMPOSE_FILE##*/}"
printf 'Backend Rust: encontrado\n'
printf 'Migrações SQL: encontradas\n'
printf 'Arquivo .env: encontrado\n'
printf 'Docker: disponível\n'
printf 'Docker Compose: válido\n'
printf '\n'

if [[ "$CHECK_ONLY" == true ]]; then
    log "Verificação concluída."
    log "Nenhum container foi iniciado ou alterado."
    exit 0
fi

# Verifica se já existem containers associados ao projeto.
mapfile -t EXISTING_CONTAINERS < <(
    "${COMPOSE[@]}" ps -aq 2>/dev/null || true
)

if ((${#EXISTING_CONTAINERS[@]} > 0)); then

    warn "Já existem containers deste projeto."
    warn "A atualização pode recriar containers e causar indisponibilidade temporária."
    warn "Os volumes não serão removidos."

    printf '\n'
    printf 'Confirme que existe um backup recente do banco PostgreSQL.\n'
    printf 'Este instalador não executa docker compose down -v.\n'
    printf '\n'

    read -r -p "Deseja continuar? [s/N] " answer || answer=""

    if [[ ! "$answer" =~ ^([sS]|[sS][iI][mM])$ ]]; then
        log "Operação cancelada. Nenhuma atualização foi iniciada."
        exit 0
    fi
fi

# Construção das imagens.
log "Construindo as imagens do CKAEW Sentinel AI..."

"${COMPOSE[@]}" build

# Inicialização dos serviços.
log "Iniciando os serviços..."

"${COMPOSE[@]}" up -d

# Exibe o estado dos containers.
printf '\n'
log "Estado atual dos serviços:"

"${COMPOSE[@]}" ps

printf '\n'

cat <<'DONE'
====================================================
 CKAEW SENTINEL AI
 Instalação/inicialização concluída!
====================================================

Endereços locais previstos:

 Dashboard via Nginx:
 http://localhost

 Dashboard direto:
 http://localhost:3000

 Backend:
 http://localhost:8080

 Serviço de IA:
 http://localhost:8000

Para acompanhar os logs:

 docker compose logs -f --tail=100

Para consultar os containers:

 docker compose ps

IMPORTANTE:
- O arquivo .env foi preservado.
- Os volumes não foram removidos.
- O banco de dados não foi apagado.
- Os backups não foram removidos.
- Nenhum comando down -v foi executado.

As portas dependem da configuração efetiva do Docker Compose.
====================================================
DONE
