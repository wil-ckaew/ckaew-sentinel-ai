#!/bin/bash

echo "🧪 TESTANDO FUNCIONALIDADES DO SISTEMA"
echo "======================================"

# 1. Login
echo -e "\n1️⃣ Testando Login..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "  ✅ Login bem sucedido"
else
  echo "  ❌ Login falhou"
  exit 1
fi

# 2. Dashboard
echo -e "\n2️⃣ Testando Dashboard..."
DASH=$(curl -s http://localhost:8080/api/dashboard/stats)
if [ $? -eq 0 ]; then
  echo "  ✅ Dashboard OK"
else
  echo "  ❌ Dashboard falhou"
fi

# 3. Assets
echo -e "\n3️⃣ Testando Ativos..."
ASSETS=$(curl -s http://localhost:8080/api/assets | jq '.total')
if [ -n "$ASSETS" ]; then
  echo "  ✅ Ativos: $ASSETS encontrados"
else
  echo "  ❌ Ativos falhou"
fi

# 4. Logs
echo -e "\n4️⃣ Testando Logs..."
LOGS=$(curl -s http://localhost:8080/api/security/logs | jq '.total')
if [ -n "$LOGS" ]; then
  echo "  ✅ Logs: $LOGS encontrados"
else
  echo "  ❌ Logs falhou"
fi

# 5. Alertas
echo -e "\n5️⃣ Testando Alertas..."
ALERTS=$(curl -s http://localhost:8080/api/alerts | jq '.total')
if [ -n "$ALERTS" ]; then
  echo "  ✅ Alertas: $ALERTS encontrados"
else
  echo "  ❌ Alertas falhou"
fi

echo -e "\n✅ TODOS OS TESTES CONCLUÍDOS!"
