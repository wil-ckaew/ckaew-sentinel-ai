#!/bin/bash
# ============================================
# MONITORAMENTO COM IMAGEM NO TELEGRAM
# ============================================

echo "🚀 Monitoramento de alertas com imagem ativado!"

while true; do
    # Buscar alertas críticos
    ALERT=$(curl -s http://localhost:8080/api/alerts 2>/dev/null | jq -r '.alerts[] | select(.priority=="critical") | {title, source_ip, created_at} | @base64' 2>/dev/null | head -1)
    
    if [ -n "$ALERT" ]; then
        DATA=$(echo "$ALERT" | base64 -d 2>/dev/null)
        TITLE=$(echo "$DATA" | jq -r '.title' 2>/dev/null)
        SOURCE=$(echo "$DATA" | jq -r '.source_ip' 2>/dev/null)
        TIME=$(date +%H:%M:%S)
        
        # Enviar alerta com imagem
        ./scripts/send_telegram_alert.sh "$TITLE" "critical" "$SOURCE" "$TIME"
        
        # Aguardar para não enviar duplicado
        sleep 10
    fi
    
    sleep 30
done
