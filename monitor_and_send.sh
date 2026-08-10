#!/bin/bash
# ============================================
# MONITOR SIMPLES - ENVIA ALERTAS PARA TELEGRAM
# ============================================

cd ~/rust/ckaew-sentinel-ai

echo "🚀 Monitor de alertas iniciado!"
echo "📱 Enviando para o Telegram..."

while true; do
    # Buscar alertas críticos das últimas 30 segundos
    ALERTS=$(curl -s http://localhost:8080/api/alerts 2>/dev/null | jq -r '.alerts[] | select(.priority=="critical") | {title, source_ip, message} | @base64' 2>/dev/null | head -1)
    
    if [ -n "$ALERTS" ] && [ "$ALERTS" != "null" ]; then
        DATA=$(echo "$ALERTS" | base64 -d 2>/dev/null)
        TITLE=$(echo "$DATA" | jq -r '.title' 2>/dev/null)
        SOURCE=$(echo "$DATA" | jq -r '.source_ip' 2>/dev/null)
        MESSAGE=$(echo "$DATA" | jq -r '.message' 2>/dev/null)
        
        if [ -n "$TITLE" ] && [ "$TITLE" != "null" ]; then
            echo "📤 Enviando alerta: $TITLE"
            python3 send_telegram.py alert "$TITLE" "critical" "${SOURCE:-Desconhecido}" "${MESSAGE:-Alerta detectado}"
            sleep 10
        fi
    fi
    
    sleep 15
done
