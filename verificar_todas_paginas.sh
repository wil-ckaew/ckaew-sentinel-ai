#!/bin/bash

echo "🔍 VERIFICANDO TODAS AS PÁGINAS EM TEMPO REAL"
echo "=============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Dashboard
echo -e "${BLUE}📊 1. DASHBOARD${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DASH=$(curl -s http://localhost:8080/api/dashboard/stats)
if [ -n "$DASH" ]; then
    echo -e "${GREEN}✅ Dashboard está respondendo${NC}"
    echo "$DASH" | jq '.'
else
    echo -e "${RED}❌ Dashboard não responde${NC}"
fi
echo ""

# 2. Incidentes (Alertas)
echo -e "${BLUE}🚨 2. INCIDENTES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ALERTS=$(curl -s http://localhost:8080/api/alerts)
if [ -n "$ALERTS" ]; then
    echo -e "${GREEN}✅ Incidentes estão respondendo${NC}"
    TOTAL=$(echo "$ALERTS" | jq '.total')
    echo "   Total de alertas: $TOTAL"
    echo "   Últimos 3 alertas:"
    echo "$ALERTS" | jq '.alerts[-3:] | .[] | {title, priority, created_at}'
else
    echo -e "${RED}❌ Incidentes não respondem${NC}"
fi
echo ""

# 3. Ativos
echo -e "${BLUE}📦 3. ATIVOS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ASSETS=$(curl -s http://localhost:8080/api/assets)
if [ -n "$ASSETS" ]; then
    echo -e "${GREEN}✅ Ativos estão respondendo${NC}"
    TOTAL=$(echo "$ASSETS" | jq '.total')
    echo "   Total de ativos: $TOTAL"
    echo "   Primeiros 3 ativos:"
    echo "$ASSETS" | jq '.assets[:3] | .[] | {name, status, criticality}'
else
    echo -e "${RED}❌ Ativos não respondem${NC}"
fi
echo ""

# 4. Logs de Segurança
echo -e "${BLUE}📝 4. LOGS DE SEGURANÇA${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGS=$(curl -s http://localhost:8080/api/security/logs)
if [ -n "$LOGS" ]; then
    echo -e "${GREEN}✅ Logs estão respondendo${NC}"
    TOTAL=$(echo "$LOGS" | jq '.total')
    echo "   Total de logs: $TOTAL"
    echo "   Últimos 3 logs:"
    echo "$LOGS" | jq '.logs[-3:] | .[] | {event_type, severity, message}'
else
    echo -e "${RED}❌ Logs não respondem${NC}"
fi
echo ""

# 5. Estatísticas
echo -e "${BLUE}📊 5. ESTATÍSTICAS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
STATS=$(curl -s http://localhost:8080/api/security/logs/stats)
if [ -n "$STATS" ]; then
    echo -e "${GREEN}✅ Estatísticas estão respondendo${NC}"
    echo "$STATS" | jq '.'
else
    echo -e "${RED}❌ Estatísticas não respondem${NC}"
fi
echo ""

# 6. Health Check
echo -e "${BLUE}❤️ 6. HEALTH CHECK${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH=$(curl -s http://localhost:8080/api/health)
if [ -n "$HEALTH" ]; then
    echo -e "${GREEN}✅ Sistema está saudável${NC}"
    echo "$HEALTH" | jq '.'
else
    echo -e "${RED}❌ Sistema não está saudável${NC}"
fi
echo ""

# 7. Resumo
echo -e "${BLUE}📋 RESUMO FINAL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   ✅ Dashboard: $(curl -s http://localhost:8080/api/dashboard/stats > /dev/null 2>&1 && echo "OK" || echo "FALHOU")"
echo "   ✅ Incidentes: $(curl -s http://localhost:8080/api/alerts > /dev/null 2>&1 && echo "OK" || echo "FALHOU")"
echo "   ✅ Ativos: $(curl -s http://localhost:8080/api/assets > /dev/null 2>&1 && echo "OK" || echo "FALHOU")"
echo "   ✅ Logs: $(curl -s http://localhost:8080/api/security/logs > /dev/null 2>&1 && echo "OK" || echo "FALHOU")"
echo "   ✅ Estatísticas: $(curl -s http://localhost:8080/api/security/logs/stats > /dev/null 2>&1 && echo "OK" || echo "FALHOU")"
echo "   ✅ Health: $(curl -s http://localhost:8080/api/health > /dev/null 2>&1 && echo "OK" || echo "FALHOU")"
echo ""

echo -e "${GREEN}✅ VERIFICAÇÃO CONCLUÍDA!${NC}"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "🔑 admin / admin123"
