#!/bin/bash

echo "🔍 TESTANDO SISTEMA CKAEW SENTINEL AI"
echo "====================================="

# 1. Verificar containers
echo -e "\n📦 STATUS DOS CONTAINERS:"
docker compose ps

# 2. Verificar backend
echo -e "\n🔧 TESTANDO BACKEND:"
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend está respondendo!"
    curl -s http://localhost:8080/api/health | jq .
else
    echo "❌ Backend não está respondendo!"
    echo "Últimos logs do backend:"
    docker logs sentinel-backend --tail 10
fi

# 3. Verificar frontend
echo -e "\n🖥️ TESTANDO FRONTEND:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend está respondendo!"
    curl -s http://localhost:3000 -o /dev/null -w "Status: %{http_code}\n"
else
    echo "❌ Frontend não está respondendo!"
    echo "Últimos logs do frontend:"
    docker logs sentinel-web --tail 10
fi

# 4. Testar comunicação frontend-backend
echo -e "\n🌐 TESTANDO COMUNICAÇÃO FRONTEND -> BACKEND:"
docker exec sentinel-web curl -s http://backend:8080/api/health 2>/dev/null && echo "✅ Frontend consegue acessar o backend" || echo "❌ Frontend NÃO consegue acessar o backend"

# 5. Testar login
echo -e "\n🔑 TESTANDO LOGIN:"
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq .

echo -e "\n✅ TESTES CONCLUÍDOS!"
