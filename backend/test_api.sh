#!/bin/bash

echo "🔍 Testando CKAEW Sentinel AI API"

# Health check
echo -e "\n📊 Health Check:"
curl -s http://localhost:8080/api/health | jq .

# Registrar usuário
echo -e "\n📝 Registrando usuário:"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst1",
    "password": "password123",
    "role": "Analyst"
  }')
echo $REGISTER_RESPONSE | jq .

# Login
echo -e "\n🔑 Fazendo login:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')
echo $LOGIN_RESPONSE | jq .

# Extrair token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo -e "\n🔐 Token JWT: $TOKEN"

# Testar endpoint protegido
echo -e "\n👤 Obtendo usuário atual:"
curl -s http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n✅ Testes concluídos!"
