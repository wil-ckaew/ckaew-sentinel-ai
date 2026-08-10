#!/bin/bash
# ============================================
# ALERTAS TELEGRAM - CKAEW SENTINEL AI
# ============================================

# Configurações (JÁ CONFIGURADO)
TELEGRAM_BOT_TOKEN="8882917542:AAF1IjODcd8JiyBM0W2BrUkpT46YbWunvqs"
TELEGRAM_CHAT_ID="920417229"  # SEU CHAT_ID

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para enviar mensagem
send_telegram() {
    local message="$1"
    
    RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d chat_id="$TELEGRAM_CHAT_ID" \
        -d text="$message" \
        -d parse_mode="HTML")
    
    if echo "$RESPONSE" | grep -q '"ok":true'; then
        echo -e "${GREEN}✅ Mensagem enviada para o Telegram${NC}"
    else
        echo -e "${RED}❌ Erro ao enviar mensagem:${NC}"
        echo "$RESPONSE" | jq -r '.description' 2>/dev/null || echo "$RESPONSE"
        return 1
    fi
}

# Teste
case "$1" in
    "test")
        echo "📱 Enviando mensagem de teste..."
        send_telegram "🛡️ <b>TESTE DE CONEXÃO</b>
        
✅ Sistema CKAEW Sentinel AI conectado!
📅 $(date +"%d/%m/%Y %H:%M:%S")
🔐 Sistema de Segurança Cibernética

📌 Mensagem de teste enviada com sucesso!"
        ;;
        
    "alert")
        TITLE="${2:-Alerta de Segurança}"
        PRIORITY="${3:-Alto}"
        SOURCE="${4:-Desconhecido}"
        TIME="${5:-$(date +"%H:%M:%S")}"
        DESC="${6:-Incidente detectado}"
        
        EMOJI="🔴"
        [ "$PRIORITY" = "Crítico" ] && EMOJI="🚨🔴"
        [ "$PRIORITY" = "Alto" ] && EMOJI="⚠️🟠"
        [ "$PRIORITY" = "Médio" ] && EMOJI="📢🟡"
        [ "$PRIORITY" = "Baixo" ] && EMOJI="ℹ️🔵"
        
        send_telegram "$EMOJI <b>ALERTA DE SEGURANÇA!</b> $EMOJI

<b>Incidente:</b> $TITLE
<b>Prioridade:</b> $PRIORITY
<b>Origem:</b> $SOURCE
<b>Hora:</b> $TIME
<b>Descrição:</b> $DESC

🔗 <a href='http://localhost:3000/incidentes'>Ver no sistema</a>"
        ;;
        
    "daily")
        TOTAL_ALERTS=$(curl -s http://localhost:8080/api/alerts | jq '.total' 2>/dev/null || echo "0")
        CRITICAL_ALERTS=$(curl -s http://localhost:8080/api/alerts | jq '.alerts[] | select(.priority=="critical") | .id' 2>/dev/null | wc -l)
        
        send_telegram "📊 <b>RELATÓRIO DIÁRIO</b>

📅 $(date +"%d/%m/%Y")

🚨 Alertas: $TOTAL_ALERTS
🔴 Críticos: $CRITICAL_ALERTS

✅ Sistema operacional normal

🔗 <a href='http://localhost:3000'>Acessar sistema</a>"
        ;;
        
    *)
        echo "📱 ALERTAS TELEGRAM - CKAEW SENTINEL AI"
        echo ""
        echo "Uso:"
        echo "  ./scripts/telegram_alerts.sh test              - Testar conexão"
        echo "  ./scripts/telegram_alerts.sh alert \"Título\" \"Prioridade\" \"IP\" \"Hora\" \"Desc\""
        echo "  ./scripts/telegram_alerts.sh daily             - Enviar relatório diário"
        echo ""
        echo "Exemplo:"
        echo "  ./scripts/telegram_alerts.sh test"
        echo "  ./scripts/telegram_alerts.sh alert \"Força Bruta\" \"Crítico\" \"192.168.1.100\" \"10:30\" \"10 tentativas falhas\""
        ;;
esac
