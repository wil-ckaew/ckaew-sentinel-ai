#!/bin/bash

echo "🔄 GERANDO ATAQUES CONTÍNUOS"
echo "============================="
echo ""
echo "Pressione Ctrl+C para parar"
echo ""

TIPOS=("BRUTE_FORCE" "MALWARE" "UNAUTHORIZED_ACCESS" "DDoS" "PHISHING")
SEVERIDADES=("critical" "critical" "high" "critical" "high")

COUNTER=0
while true; do
  COUNTER=$((COUNTER + 1))
  IP="192.168.$((RANDOM % 255)).$((RANDOM % 255))"
  
  # Escolher tipo aleatório
  INDEX=$((RANDOM % ${#TIPOS[@]}))
  TIPO=${TIPOS[$INDEX]}
  SEVERIDADE=${SEVERIDADES[$INDEX]}
  
  case $TIPO in
    "BRUTE_FORCE")
      MSG="🔴 Tentativa de força bruta de $IP"
      ;;
    "MALWARE")
      MSG="🦠 Arquivo malicioso detectado em $IP"
      ;;
    "UNAUTHORIZED_ACCESS")
      MSG="🚫 Acesso não autorizado de $IP"
      ;;
    "DDoS")
      MSG="🌊 Ataque DDoS detectado de $IP"
      ;;
    "PHISHING")
      MSG="🎣 Domínio de phishing detectado: $IP"
      ;;
  esac
  
  # Gerar alerta
  curl -s -X POST http://localhost:8080/api/security/logs \
    -H "Content-Type: application/json" \
    -d "{
      \"event_type\": \"$TIPO\",
      \"severity\": \"$SEVERIDADE\",
      \"message\": \"$MSG\",
      \"source_ip\": \"$IP\"
    }" > /dev/null
  
  echo "[$(date '+%H:%M:%S')] Ataque #$COUNTER: $TIPO - $IP"
  sleep 2
done
