#!/bin/bash

echo "🔥 INICIANDO TESTE DE ATAQUE COMPLETO"
echo "====================================="
echo ""
echo "⏳ Gerando ataques... Prepare-se para ver os alertas!"
echo ""

# 1. Força Bruta
echo "1️⃣ Ataque de Força Bruta..."
for i in {1..5}; do
  IP="192.168.1.$((RANDOM % 255))"
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"admin\",\"password\":\"teste$i\"}" > /dev/null
  
  if [ $((i % 2)) -eq 0 ]; then
    curl -s -X POST http://localhost:8080/api/security/logs \
      -H "Content-Type: application/json" \
      -d "{
        \"event_type\": \"BRUTE_FORCE\",
        \"severity\": \"critical\",
        \"message\": \"🔴 Força bruta detectada de $IP\",
        \"source_ip\": \"$IP\"
      }" > /dev/null
    echo "   ✅ Alerta de força bruta de $IP"
  fi
  sleep 1
done

echo ""

# 2. Malware
echo "2️⃣ Ataque de Malware..."
for i in {1..3}; do
  IP="DESKTOP-$((RANDOM % 9999))"
  curl -s -X POST http://localhost:8080/api/security/logs \
    -H "Content-Type: application/json" \
    -d "{
      \"event_type\": \"MALWARE\",
      \"severity\": \"critical\",
      \"message\": \"🦠 Malware detectado em $IP\",
      \"source_ip\": \"$IP\"
    }" > /dev/null
  echo "   ✅ Alerta de malware em $IP"
  sleep 1
done

echo ""

# 3. Acesso Não Autorizado
echo "3️⃣ Acesso Não Autorizado..."
IPS=("192.168.1.100" "10.0.1.50" "172.16.0.25")
for IP in "${IPS[@]}"; do
  curl -s -X POST http://localhost:8080/api/security/logs \
    -H "Content-Type: application/json" \
    -d "{
      \"event_type\": \"UNAUTHORIZED_ACCESS\",
      \"severity\": \"critical\",
      \"message\": \"🚫 Acesso não autorizado de $IP\",
      \"source_ip\": \"$IP\"
    }" > /dev/null
  echo "   ✅ Alerta de acesso não autorizado de $IP"
  sleep 1
done

echo ""

# 4. DDoS
echo "4️⃣ Ataque DDoS..."
for i in {1..3}; do
  IP="10.0.$((RANDOM % 255)).$((RANDOM % 255))"
  curl -s -X POST http://localhost:8080/api/security/logs \
    -H "Content-Type: application/json" \
    -d "{
      \"event_type\": \"DDoS\",
      \"severity\": \"critical\",
      \"message\": \"🌊 Ataque DDoS de $IP\",
      \"source_ip\": \"$IP\"
    }" > /dev/null
  echo "   ✅ Alerta DDoS de $IP"
  sleep 1
done

echo ""
echo "✅ TESTE DE ATAQUE CONCLUÍDO!"
echo ""
echo "🔴 Você deve ter recebido alertas com:"
echo "  🔊 Som de sirene"
echo "  💥 Tela piscando"
echo "  📱 Popup de alerta"
echo "  🔔 Notificação do navegador"
echo ""
echo "🌐 Veja os alertas em: http://localhost:3000/incidentes"
