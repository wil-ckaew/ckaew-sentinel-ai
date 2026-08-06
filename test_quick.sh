#!/bin/bash

echo "🚀 TESTE RÁPIDO - CKAEW SENTINEL AI"
echo "==================================="
echo ""

# 1. Backend
echo "📡 Backend:"
curl -s http://localhost:8080/api/health | jq -r '.status' 2>/dev/null && echo "✅ Online" || echo "❌ Offline"

# 2. Frontend
echo ""
echo "🖥️ Frontend:"
curl -s http://localhost:3000 -o /dev/null -w "HTTP: %{http_code}\n" 2>/dev/null

# 3. Dados
echo ""
echo "📊 Dados:"
echo "  Ativos: $(curl -s http://localhost:8080/api/assets | jq '.total' 2>/dev/null || echo '0')"
echo "  Alertas: $(curl -s http://localhost:8080/api/alerts | jq '.total' 2>/dev/null || echo '0')"
echo "  Logs: $(curl -s http://localhost:8080/api/security/logs | jq '.total' 2>/dev/null || echo '0')"

# 4. Login
echo ""
echo "🔑 Login:"
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | jq -r '.token' 2>/dev/null)
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "  ✅ Login OK"
else
    echo "  ❌ Login Falhou"
fi

echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "🔑 admin / admin123"
