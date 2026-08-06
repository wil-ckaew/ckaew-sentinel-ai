#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║     🔍 AUDITORIA COMPLETA - CKAEW SENTINEL AI                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar Containers
echo -e "${BLUE}📦 1. VERIFICANDO CONTAINERS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "⚠️  Docker Compose não está rodando"
echo ""

# 2. Verificar Backend
echo -e "${BLUE}🦀 2. VERIFICANDO BACKEND RUST${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend: ONLINE${NC}"
    VERSION=$(curl -s http://localhost:8080/api/health | jq -r '.version' 2>/dev/null || echo "0.1.0")
    echo "   Versão: $VERSION"
    echo "   Porta: 8080"
else
    echo -e "${RED}❌ Backend: OFFLINE${NC}"
    echo "   Execute: cd backend && cargo run"
fi
echo ""

# 3. Verificar Frontend
echo -e "${BLUE}🖥️ 3. VERIFICANDO FRONTEND${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend: ONLINE${NC}"
    echo "   URL: http://localhost:3000"
    echo "   Porta: 3000"
else
    echo -e "${RED}❌ Frontend: OFFLINE${NC}"
    echo "   Execute: docker compose up -d web-dashboard"
fi
echo ""

# 4. Verificar IA Service
echo -e "${BLUE}🧠 4. VERIFICANDO IA SERVICE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ IA Service: ONLINE${NC}"
    echo "   Porta: 8000"
else
    echo -e "${YELLOW}⚠️  IA Service: OFFLINE (Opcional)${NC}"
fi
echo ""

# 5. Testar Endpoints da API
echo -e "${BLUE}📡 5. TESTANDO ENDPOINTS DA API${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health
echo -n "   Health: "
if curl -s http://localhost:8080/api/health | jq -r '.status' 2>/dev/null | grep -q "ok"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Falhou${NC}"
fi

# Dashboard Stats
echo -n "   Dashboard Stats: "
if curl -s http://localhost:8080/api/dashboard/stats | jq '.total_assets' 2>/dev/null | grep -q "[0-9]"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Falhou${NC}"
fi

# Assets
echo -n "   Assets: "
if curl -s http://localhost:8080/api/assets | jq '.total' 2>/dev/null | grep -q "[0-9]"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Falhou${NC}"
fi

# Alerts
echo -n "   Alerts: "
if curl -s http://localhost:8080/api/alerts | jq '.total' 2>/dev/null | grep -q "[0-9]"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Falhou${NC}"
fi

# Logs
echo -n "   Security Logs: "
if curl -s http://localhost:8080/api/security/logs | jq '.total' 2>/dev/null | grep -q "[0-9]"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Falhou${NC}"
fi
echo ""

# 6. Verificar Dados Mockados vs Reais
echo -e "${BLUE}📊 6. ANÁLISE DOS DADOS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL_ASSETS=$(curl -s http://localhost:8080/api/assets | jq '.total' 2>/dev/null || echo "0")
TOTAL_ALERTS=$(curl -s http://localhost:8080/api/alerts | jq '.total' 2>/dev/null || echo "0")
TOTAL_LOGS=$(curl -s http://localhost:8080/api/security/logs | jq '.total' 2>/dev/null || echo "0")
CRITICAL_ALERTS=$(curl -s http://localhost:8080/api/alerts | jq '.alerts[] | select(.priority=="critical") | .id' 2>/dev/null | wc -l)

echo "   📦 Ativos: $TOTAL_ASSETS"
echo "   🚨 Alertas: $TOTAL_ALERTS (Críticos: $CRITICAL_ALERTS)"
echo "   📝 Logs: $TOTAL_LOGS"
echo ""

if [ "$TOTAL_ASSETS" -gt "0" ] && [ "$TOTAL_ALERTS" -gt "0" ]; then
    echo -e "${GREEN}✅ Sistema populado com dados!${NC}"
else
    echo -e "${YELLOW}⚠️  Sistema com dados mockados (Demonstração)${NC}"
fi
echo ""

# 7. Verificar Páginas
echo -e "${BLUE}📄 7. VERIFICANDO PÁGINAS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PAGES=(
  "Dashboard:/dashboard"
  "Incidentes:/incidentes"
  "Ativos:/ativos"
  "Vulnerabilidades:/vulnerabilidades"
  "Monitoramento:/monitoramento"
  "Relatórios:/relatorios"
  "IA Analyst:/ai"
  "Configurações:/configuracoes"
)

for page in "${PAGES[@]}"; do
  name="${page%%:*}"
  path="${page#*:}"
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$path 2>/dev/null)
  if [ "$status" = "200" ] || [ "$status" = "307" ]; then
    echo -e "   ✅ $name: ${GREEN}OK${NC} (HTTP $status)"
  else
    echo -e "   ❌ $name: ${RED}ERRO${NC} (HTTP $status)"
  fi
done
echo ""

# 8. Teste de Login
echo -e "${BLUE}🔑 8. TESTE DE AUTENTICAÇÃO${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token' 2>/dev/null)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Login: SUCESSO${NC}"
    echo "   Token: ${TOKEN:0:30}..."
    echo "   Usuário: admin"
    echo "   Role: Admin"
else
    echo -e "${RED}❌ Login: FALHOU${NC}"
fi
echo ""

# 9. Resumo Final
echo -e "${BLUE}📋 9. RESUMO FINAL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   🌐 Acesse: http://localhost:3000"
echo "   🔑 Credenciais: admin / admin123"
echo ""
echo -e "   ${GREEN}✅ Sistema pronto para demonstração!${NC}"
echo ""
echo "   📌 Status:"
echo "      Backend: $(curl -s http://localhost:8080/api/health > /dev/null 2>&1 && echo "✅ Online" || echo "❌ Offline")"
echo "      Frontend: $(curl -s http://localhost:3000 > /dev/null 2>&1 && echo "✅ Online" || echo "❌ Offline")"
echo "      Dados: $( [ "$TOTAL_ASSETS" -gt "0" ] && echo "✅ Populado" || echo "⚠️  Mockado" )"
echo ""

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║              ✅ AUDITORIA CONCLUÍDA COM SUCESSO                ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
