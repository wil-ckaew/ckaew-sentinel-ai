#!/bin/bash

echo "🔥 TESTE DE ATAQUE - CKAEW SENTINEL AI"
echo "======================================="
echo ""
echo "⚠️  ESTE É UM TESTE CONTROLADO EM AMBIENTE DE DESENVOLVIMENTO"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para gerar logs
generate_log() {
    local event=$1
    local severity=$2
    local message=$3
    local ip=$4
    
    curl -X POST http://localhost:8080/api/security/logs \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"event_type\": \"$event\",
        \"severity\": \"$severity\",
        \"message\": \"$message\",
        \"source_ip\": \"$ip\"
      }" 2>/dev/null
}

# 1. Fazer login para obter token
echo -e "${BLUE}📡 1. Autenticando...${NC}"
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ Falha na autenticação${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Token obtido com sucesso${NC}"
echo ""

# 2. Teste de Força Bruta
echo -e "${YELLOW}🔓 2. Simulando Ataque de Força Bruta...${NC}"
for i in {1..10}; do
    IP="192.168.1.$((RANDOM % 255))"
    echo "   Tentativa $i de $IP"
    
    curl -X POST http://localhost:8080/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"admin\",\"password\":\"senha_errada_$i\"}" 2>/dev/null > /dev/null
    
    # Gerar log a cada 3 tentativas
    if [ $((i % 3)) -eq 0 ]; then
        generate_log "BRUTE_FORCE" "warning" "Múltiplas tentativas de login falhas de $IP" "$IP"
    fi
done
echo -e "${GREEN}✅ Força Bruta simulada${NC}"
echo ""

# 3. Teste de Escaneamento de Portas
echo -e "${YELLOW}🔍 3. Simulando Escaneamento de Portas...${NC}"
for port in 21 22 23 25 80 443 3306 5432 8080 8443; do
    IP="10.0.0.$((RANDOM % 255))"
    echo "   Escaneando porta $port em $IP"
    
    if [ $((RANDOM % 5)) -eq 0 ]; then
        generate_log "PORT_SCAN" "error" "Porta $port aberta detectada em $IP" "$IP"
    fi
done
echo -e "${GREEN}✅ Escaneamento de portas simulado${NC}"
echo ""

# 4. Teste de Malware
echo -e "${YELLOW}🦠 4. Simulando Detecção de Malware...${NC}"
for i in {1..3}; do
    IP="DESKTOP-$((RANDOM % 10000))"
    echo "   Detectando malware em $IP"
    
    generate_log "MALWARE_DETECTED" "critical" "Arquivo malicioso 'virus_$i.exe' detectado em $IP" "$IP"
done
echo -e "${GREEN}✅ Malware simulado${NC}"
echo ""

# 5. Teste de Acesso Não Autorizado
echo -e "${YELLOW}🚫 5. Simulando Acesso Não Autorizado...${NC}"
IPS=("192.168.1.100" "10.0.1.50" "172.16.0.25")
for ip in "${IPS[@]}"; do
    echo "   Acesso suspeito de $ip"
    generate_log "UNAUTHORIZED_ACCESS" "critical" "Tentativa de acesso não autorizado de $ip" "$ip"
done
echo -e "${GREEN}✅ Acesso não autorizado simulado${NC}"
echo ""

# 6. Teste de Ataque DDoS
echo -e "${YELLOW}🌊 6. Simulando Ataque DDoS...${NC}"
for i in {1..5}; do
    IP="10.0.$((RANDOM % 255)).$((RANDOM % 255))"
    echo "   Tráfego suspeito de $IP"
    
    if [ $((RANDOM % 3)) -eq 0 ]; then
        generate_log "DDoS_ATTACK" "critical" "Possível ataque DDoS detectado de $IP" "$IP"
    fi
done
echo -e "${GREEN}✅ Ataque DDoS simulado${NC}"
echo ""

# 7. Teste de Phishing
echo -e "${YELLOW}🎣 7. Simulando Phishing...${NC}"
DOMAINS=("paypal-seguro.com" "banco-do-brasil-seguro.online" "itau-login.seguro")
for domain in "${DOMAINS[@]}"; do
    echo "   Domínio suspeito: $domain"
    generate_log "PHISHING_DETECTED" "high" "Domínio de phishing detectado: $domain" "0.0.0.0"
done
echo -e "${GREEN}✅ Phishing simulado${NC}"
echo ""

# 8. Verificar Alertas Gerados
echo -e "${BLUE}📊 8. Alertas Gerados:${NC}"
echo ""

# Buscar alertas críticos
CRITICAL_COUNT=$(curl -s http://localhost:8080/api/alerts \
  -H "Authorization: Bearer $TOKEN" | jq '.alerts[] | select(.priority=="critical") | .id' 2>/dev/null | wc -l)

# Buscar alertas altos
HIGH_COUNT=$(curl -s http://localhost:8080/api/alerts \
  -H "Authorization: Bearer $TOKEN" | jq '.alerts[] | select(.priority=="high") | .id' 2>/dev/null | wc -l)

# Buscar total de alertas
TOTAL_COUNT=$(curl -s http://localhost:8080/api/alerts \
  -H "Authorization: Bearer $TOKEN" | jq '.total' 2>/dev/null)

echo "   🚨 Total de Alertas: $TOTAL_COUNT"
echo "   🔴 Críticos: $CRITICAL_COUNT"
echo "   🟠 Altos: $HIGH_COUNT"

# 9. Verificar Logs Gerados
echo ""
echo -e "${BLUE}📝 9. Logs Gerados:${NC}"
LOG_COUNT=$(curl -s http://localhost:8080/api/security/logs \
  -H "Authorization: Bearer $TOKEN" | jq '.total' 2>/dev/null)
echo "   📊 Total de Logs: $LOG_COUNT"

echo ""
echo -e "${GREEN}✅ TESTE DE ATAQUE CONCLUÍDO!${NC}"
echo ""
echo -e "${BLUE}📊 RESULTADOS:${NC}"
echo "   🔴 Alertas Críticos: $CRITICAL_COUNT"
echo "   🟠 Alertos Altos: $HIGH_COUNT"
echo "   📝 Logs Gerados: $LOG_COUNT"
echo ""
echo -e "${GREEN}🌐 Acesse o Dashboard para ver os alertas:${NC}"
echo "   http://localhost:3000"
echo "   🔑 admin / admin123"
