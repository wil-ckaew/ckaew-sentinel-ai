#!/bin/bash
# ============================================
# DEPLOY COMPLETO - CKAEW SENTINEL AI
# ============================================

set -e

echo "🚀 INICIANDO DEPLOY DO CKAEW SENTINEL AI"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar pré-requisitos
echo -e "${BLUE}📋 1. Verificando pré-requisitos...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker OK${NC}"

# 2. Carregar variáveis
echo -e "${BLUE}🔑 2. Carregando variáveis...${NC}"
if [ -f ".env" ]; then
    source .env
    echo -e "${GREEN}✅ .env carregado${NC}"
else
    echo -e "${YELLOW}⚠️  .env não encontrado, usando padrões${NC}"
fi

# 3. Fazer backup (se o container estiver rodando)
echo -e "${BLUE}💾 3. Fazendo backup...${NC}"
if docker ps | grep -q sentinel-db; then
    ./scripts/backup.sh || echo -e "${YELLOW}⚠️  Backup falhou, continuando...${NC}"
else
    echo -e "${YELLOW}⚠️  Database não está rodando, pulando backup${NC}"
fi

# 4. Parar serviços antigos
echo -e "${BLUE}🛑 4. Parando serviços antigos...${NC}"
docker compose down 2>/dev/null || true

# 5. Subir monitoramento (se existir)
if [ -f "docker-compose.monitoring.yml" ]; then
    echo -e "${BLUE}📊 5. Iniciando monitoramento...${NC}"
    docker compose -f docker-compose.monitoring.yml up -d 2>/dev/null || true
fi

# 6. Build e deploy
echo -e "${BLUE}🔨 6. Construindo e iniciando serviços...${NC}"
docker compose up -d --build

# 7. Aguardar serviços
echo -e "${BLUE}⏳ 7. Aguardando serviços iniciarem...${NC}"
sleep 15

# 8. Verificar saúde
echo -e "${BLUE}🔍 8. Verificando saúde dos serviços...${NC}"

for service in backend ai-service web-dashboard; do
    if docker compose ps $service 2>/dev/null | grep -q "healthy"; then
        echo -e "${GREEN}✅ $service: OK${NC}"
    else
        echo -e "${RED}❌ $service: FAILED${NC}"
        docker logs sentinel-$service --tail 10 2>/dev/null || true
    fi
done

echo ""
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO!${NC}"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "🔑 Credenciais: admin / admin123"
echo ""
echo "📋 Comandos úteis:"
echo "  docker compose logs -f"
echo "  docker compose ps"
echo "  ./scripts/backup.sh"

# Iniciar bot Telegram
./scripts/start_bot.sh
