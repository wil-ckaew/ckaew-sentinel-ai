#!/bin/bash

echo "🌱 Inserindo ativos de exemplo..."

# Primeiro, pegar o token do admin
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Falha ao obter token. Verifique se o servidor está rodando."
    exit 1
fi

echo "✅ Token obtido com sucesso"

# Criar servidor web
curl -s -X POST http://localhost:8080/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Web Server Production",
    "description": "Main web application server",
    "ip_address": "10.0.1.10",
    "asset_type": "Server",
    "status": "Active",
    "criticality": "High",
    "location": "Data Center A",
    "department": "IT Operations"
  }'

echo ""

# Criar banco de dados
curl -s -X POST http://localhost:8080/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "PostgreSQL Database",
    "description": "Production database server",
    "ip_address": "10.0.1.20",
    "asset_type": "Database",
    "status": "Active",
    "criticality": "Critical",
    "location": "Data Center A",
    "department": "IT Operations"
  }'

echo ""

# Criar firewall
curl -s -X POST http://localhost:8080/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Edge Firewall",
    "description": "Network perimeter firewall",
    "ip_address": "10.0.0.1",
    "asset_type": "Firewall",
    "status": "Active",
    "criticality": "Critical",
    "location": "Network Edge",
    "department": "Network Security"
  }'

echo ""

# Criar workstation
curl -s -X POST http://localhost:8080/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Security Analyst Workstation",
    "description": "Workstation for security team",
    "ip_address": "10.0.2.50",
    "asset_type": "Workstation",
    "status": "Active",
    "criticality": "Medium",
    "location": "Security Operations Center",
    "department": "Security"
  }'

echo ""

# Criar container
curl -s -X POST http://localhost:8080/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "API Gateway Container",
    "description": "Kubernetes API gateway",
    "ip_address": "10.0.3.100",
    "asset_type": "Container",
    "status": "Active",
    "criticality": "High",
    "location": "Kubernetes Cluster",
    "department": "DevOps"
  }'

echo ""
echo "✅ Ativos criados com sucesso!"

# Listar ativos
echo -e "\n📋 Listando ativos:"
curl -s -X GET http://localhost:8080/api/assets \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.assets[] | {name, ip_address, asset_type, criticality}'

echo -e "\n🔍 Estatísticas de logs:"
curl -s -X GET http://localhost:8080/api/security/logs/stats \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
