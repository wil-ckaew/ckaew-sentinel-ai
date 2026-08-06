#!/bin/bash

echo "🔐 CKAEW Sentinel AI - Test Suite Completo"
echo "==========================================="

# Login
echo -e "\n1️⃣ Login como admin..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Falha no login"
    exit 1
fi
echo "✅ Login realizado"

# Listar assets
echo -e "\n2️⃣ Listando assets..."
curl -s -X GET http://localhost:8080/api/assets \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.assets[] | {name, ip_address, asset_type}'

# Criar log de segurança
echo -e "\n3️⃣ Criando log de segurança..."
curl -s -X POST http://localhost:8080/api/security/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "event_type": "FAILED_LOGIN",
    "severity": "warning",
    "message": "Multiple failed login attempts from 192.168.1.100",
    "source_ip": "192.168.1.100"
  }' | jq .

# Criar log crítico
echo -e "\n4️⃣ Criando log crítico (deve gerar alerta)..."
curl -s -X POST http://localhost:8080/api/security/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "event_type": "SUSPICIOUS_ACTIVITY",
    "severity": "critical",
    "message": "Potential data exfiltration detected",
    "source_ip": "10.0.1.10"
  }' | jq .

# Estatísticas
echo -e "\n5️⃣ Estatísticas de logs..."
curl -s -X GET http://localhost:8080/api/security/logs/stats \
  -H "Authorization: Bearer $TOKEN" \
  | jq .

echo -e "\n✅ Testes concluídos!"
