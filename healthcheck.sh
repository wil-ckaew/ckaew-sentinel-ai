#!/bin/bash
# ============================================
# HEALTH CHECK - CKAEW SENTINEL AI
# ============================================

echo "🔍 VERIFICANDO SAÚDE DO SISTEMA"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Backend
echo -e "${BLUE}📡 Backend:${NC}"
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health)
if [ "$BACKEND" = "200" ]; then
    echo -e "${GREEN}✅ Online (HTTP $BACKEND)${NC}"
else
    echo -e "${RED}❌ Offline (HTTP $BACKEND)${NC}"
fi

# 2. AI Service
echo -e "${BLUE}🧠 AI Service:${NC}"
AI=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$AI" = "200" ]; then
    echo -e "${GREEN}✅ Online (HTTP $AI)${NC}"
else
    echo -e "${RED}❌ Offline (HTTP $AI)${NC}"
fi

# 3. Frontend
echo -e "${BLUE}🖥️ Frontend:${NC}"
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND" = "200" ]; then
    echo -e "${GREEN}✅ Online (HTTP $FRONTEND)${NC}"
else
    echo -e "${RED}❌ Offline (HTTP $FRONTEND)${NC}"
fi

# 4. Database
echo -e "${BLUE}🐘 Database:${NC}"
DB=$(docker exec sentinel-db pg_isready -U postgres 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Online${NC}"
else
    echo -e "${RED}❌ Offline${NC}"
fi

# 5. Redis
echo -e "${BLUE}🔄 Redis:${NC}"
REDIS=$(docker exec sentinel-redis redis-cli ping 2>/dev/null)
if [ "$REDIS" = "PONG" ]; then
    echo -e "${GREEN}✅ Online${NC}"
else
    echo -e "${RED}❌ Offline${NC}"
fi

echo ""
echo -e "${BLUE}📊 Resumo:${NC}"
TOTAL=0
OK=0
for service in Backend AI Frontend Database Redis; do
    TOTAL=$((TOTAL+1))
done

echo -e "${GREEN}Sistema: ${OK}/${TOTAL} serviços saudáveis${NC}"
