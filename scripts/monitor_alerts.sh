#!/bin/bash
# ============================================
# MONITOR DE ALERTAS - ENVIA PARA TELEGRAM
# ============================================

TOKEN="8882917542:AAF1IjODcd8JiyBM0W2BrUkpT46YbWunvqs"
CHAT_ID="920417229"
LAST_ALERT_FILE="/tmp/last_alert_time.txt"

# Função para enviar ao Telegram com formatação HTML
send_telegram() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
        -d chat_id="$CHAT_ID" \
        -d text="$message" \
        -d parse_mode="HTML" \
        -d disable_web_page_preview="false" > /dev/null
}

# Função para enviar com imagem (via link)
send_alert_with_image() {
    local title="$1"
    local priority="$2"
    local source="$3"
    local time="$4"
    local date="$5"
    
    # Emoji por prioridade
    case $priority in
        "critical") EMOJI="🚨🔴" ;;
        "high") EMOJI="⚠️🟠" ;;
        "medium") EMOJI="📢🟡" ;;
        *) EMOJI="ℹ️🔵" ;;
    esac
    
    # Imagem de alerta (uso um ícone do sistema)
    local image_url="https://img.icons8.com/color/96/000000/security-checked--v1.png"
    
    message="$EMOJI <b>ALERTA DE SEGURANÇA!</b> $EMOJI

<b>📌 Incidente:</b> $title
<b>⚠️ Prioridade:</b> $priority
<b>📍 Origem:</b> ${source:-Desconhecido}
<b>📅 Data:</b> $date
<b>🕐 Hora:</b> $time

🔗 <a href='http://localhost:3000/incidentes'>📊 Ver detalhes no sistema</a>

<a href='$image_url'>&#8205;</a>"
    
    send_telegram "$message"
}

# Verificar último alerta processado
if [ ! -f "$LAST_ALERT_FILE" ]; then
    echo $(date -d '5 minutes ago' +%s) > $LAST_ALERT_FILE
fi

LAST_TIME=$(cat $LAST_ALERT_FILE)
CURRENT_TIME=$(date +%s)

# Buscar alertas críticos novos
echo "🔍 Verificando novos alertas..."

ALERTS=$(curl -s http://localhost:8080/api/alerts 2>/dev/null | jq -r --arg time "$LAST_TIME" '.alerts[] | select(.created_at | fromdateiso8601 > ($time | tonumber)) | select(.priority == "critical" or .priority == "high") | {title, priority, source_ip, created_at} | @base64' 2>/dev/null)

if [ -n "$ALERTS" ] && [ "$ALERTS" != "null" ]; then
    echo "$ALERTS" | while read alert_b64; do
        alert=$(echo "$alert_b64" | base64 -d 2>/dev/null)
        if [ -n "$alert" ]; then
            title=$(echo "$alert" | jq -r '.title' 2>/dev/null)
            priority=$(echo "$alert" | jq -r '.priority' 2>/dev/null)
            source=$(echo "$alert" | jq -r '.source_ip' 2>/dev/null)
            created_at=$(echo "$alert" | jq -r '.created_at' 2>/dev/null)
            
            if [ -n "$created_at" ]; then
                time=$(echo "$created_at" | cut -d'T' -f2 | cut -d'.' -f1)
                date=$(echo "$created_at" | cut -d'T' -f1)
            else
                time=$(date +%H:%M:%S)
                date=$(date +%Y-%m-%d)
            fi
            
            echo "📱 Enviando alerta: $title"
            send_alert_with_image "$title" "$priority" "$source" "$time" "$date"
            sleep 1
        fi
    done
else
    echo "✅ Nenhum novo alerta crítico encontrado."
fi

# Atualizar timestamp
echo $CURRENT_TIME > $LAST_ALERT_FILE

echo "✅ Monitoramento concluído!"
