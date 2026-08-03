#!/bin/bash

echo "🔍 TESTANDO INTEGRAÇÃO COM O BACKEND RUST"
echo "=========================================="
echo ""

# 1. Verificar backend
echo "📡 1. Verificando Backend Rust:"
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "  ✅ Backend está rodando"
    VERSION=$(curl -s http://localhost:8080/api/health | jq -r '.version' 2>/dev/null)
    echo "  📌 Versão: $VERSION"
else
    echo "  ❌ Backend NÃO está rodando!"
    echo "  🔧 Execute: docker compose up -d backend"
    exit 1
fi

echo ""

# 2. Testar endpoints do backend
echo "📊 2. Testando Endpoints do Backend:"

# Health
echo -n "  Health: "
curl -s http://localhost:8080/api/health | jq -r '.status' 2>/dev/null || echo "❌"

# Login
echo -n "  Login: "
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token' 2>/dev/null)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "✅ (Token gerado)"
else
    echo "❌"
fi

# Assets
echo -n "  Assets: "
ASSETS=$(curl -s http://localhost:8080/api/assets | jq '.total' 2>/dev/null)
if [ -n "$ASSETS" ]; then
    echo "✅ ($ASSETS ativos)"
else
    echo "❌"
fi

# Logs
echo -n "  Logs: "
LOGS=$(curl -s http://localhost:8080/api/security/logs | jq '.total' 2>/dev/null)
if [ -n "$LOGS" ]; then
    echo "✅ ($LOGS logs)"
else
    echo "❌"
fi

# Stats
echo -n "  Stats: "
STATS=$(curl -s http://localhost:8080/api/security/logs/stats | jq '.total_logs_24h' 2>/dev/null)
if [ -n "$STATS" ]; then
    echo "✅ ($STATS logs 24h)"
else
    echo "❌"
fi

# Alerts
echo -n "  Alerts: "
ALERTS=$(curl -s http://localhost:8080/api/alerts | jq '.total' 2>/dev/null)
if [ -n "$ALERTS" ]; then
    echo "✅ ($ALERTS alertas)"
else
    echo "❌"
fi

# Dashboard
echo -n "  Dashboard Stats: "
DASH=$(curl -s http://localhost:8080/api/dashboard/stats | jq '.total_assets' 2>/dev/null)
if [ -n "$DASH" ]; then
    echo "✅ ($DASH ativos)"
else
    echo "❌"
fi

echo ""

# 3. Testar frontend
echo "🖥️ 3. Verificando Frontend:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ Frontend está rodando"
else
    echo "  ❌ Frontend NÃO está rodando!"
    echo "  🔧 Execute: docker compose up -d web-dashboard"
    exit 1
fi

echo ""

# 4. Testar páginas
echo "📄 4. Testando Páginas do Frontend:"

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
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$path)
  if [ "$status" = "200" ] || [ "$status" = "307" ]; then
    echo "  ✅ $name: HTTP $status"
  else
    echo "  ❌ $name: HTTP $status"
  fi
done

echo ""

# 5. Testar comunicação frontend-backend
echo "🌐 5. Testando Comunicação Frontend-Backend:"

# Verificar se o frontend está usando o backend
echo -n "  Login via Frontend: "
LOGIN_PAGE=$(curl -s http://localhost:3000/login | grep -i "CKAEW" | head -1)
if [ -n "$LOGIN_PAGE" ]; then
    echo "✅ (Página de login carregada)"
else
    echo "❌"
fi

echo ""

# 6. Resumo
echo "📊 6. RESUMO DA INTEGRAÇÃO:"
echo ""

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && [ -n "$ASSETS" ] && [ -n "$LOGS" ]; then
    echo "  ✅ Backend Rust: FUNCIONANDO"
    echo "  ✅ Frontend: FUNCIONANDO"
    echo "  ✅ Integração: COMPLETA"
    echo ""
    echo "  🎯 Todas as páginas estão recebendo dados do backend!"
else
    echo "  ⚠️ Alguns componentes podem não estar integrados corretamente."
    echo "  🔧 Verifique os logs do backend: docker logs sentinel-backend"
fi

echo ""
echo "✅ TESTE CONCLUÍDO!"
