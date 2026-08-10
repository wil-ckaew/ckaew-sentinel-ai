#!/bin/bash
# ============================================
# ENVIAR ALERTA COM IMAGEM PARA TELEGRAM
# ============================================

TOKEN="8882917542:AAF1IjODcd8JiyBM0W2BrUkpT46YbWunvqs"
CHAT_ID="920417229"

send_alert() {
    local title="$1"
    local priority="$2"
    local source="$3"
    local time="$4"
    
    # Escolher emoji e cor
    case $priority in
        "critical") 
            EMOJI="🚨🔴"
            COLOR="#FF0000"
            ;;
        "high") 
            EMOJI="⚠️🟠"
            COLOR="#FF6B00"
            ;;
        "medium") 
            EMOJI="📢🟡"
            COLOR="#FFD700"
            ;;
        *) 
            EMOJI="ℹ️🔵"
            COLOR="#0066FF"
            ;;
    esac
    
    # Usar imagem de segurança
    IMAGE_URL="https://img.icons8.com/color/96/000000/security-checked--v1.png"
    
    message="$EMOJI <b>ALERTA DE SEGURANÇA!</b> $EMOJI

<b>📌 Incidente:</b> $title
<b>⚠️ Prioridade:</b> $priority
<b>📍 Origem:</b> ${source:-Desconhecido}
<b>🕐 Hora:</b> $time

🔗 <a href='http://localhost:3000/incidentes'>📊 Ver detalhes no sistema</a>

<a href='$IMAGE_URL'>&#8205;</a>"
    
    curl -s -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
        -d chat_id="$CHAT_ID" \
        -d text="$message" \
        -d parse_mode="HTML" \
        -d disable_web_page_preview="false"
}

# Uso
case "$1" in
    "test")
        send_alert "🧪 Teste do Sistema" "critical" "192.168.1.100" "$(date +%H:%M:%S)"
        echo "✅ Alerta de teste enviado!"
        ;;
    "attack")
        send_alert "🚨 Ataque Detectado" "critical" "$2" "$(date +%H:%M:%S)"
        echo "✅ Alerta de ataque enviado!"
        ;;
    *)
        send_alert "$1" "$2" "$3" "$4"
        ;;
esac
