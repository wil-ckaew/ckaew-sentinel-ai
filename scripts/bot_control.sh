#!/bin/bash
# ============================================
# CONTROLE DO BOT TELEGRAM
# ============================================

case "$1" in
    "start")
        echo "🤖 Iniciando bot Telegram..."
        cd ~/rust/ckaew-sentinel-ai
        nohup python3 scripts/telegram_bot.py > telegram_bot.log 2>&1 &
        echo "✅ Bot iniciado!"
        echo "📱 Envie /help no Telegram para ver os comandos"
        ;;
    
    "stop")
        echo "🛑 Parando bot Telegram..."
        pkill -f telegram_bot.py
        echo "✅ Bot parado!"
        ;;
    
    "restart")
        echo "🔄 Reiniciando bot..."
        $0 stop
        sleep 2
        $0 start
        ;;
    
    "status")
        if pgrep -f telegram_bot.py > /dev/null; then
            echo "✅ Bot está rodando!"
            echo "📋 Últimas mensagens:"
            tail -5 ~/rust/ckaew-sentinel-ai/telegram_bot.log
        else
            echo "❌ Bot não está rodando!"
        fi
        ;;
    
    "logs")
        echo "📋 Logs do bot:"
        tail -f ~/rust/ckaew-sentinel-ai/telegram_bot.log
        ;;
    
    *)
        echo "📱 CONTROLE DO BOT TELEGRAM"
        echo "============================"
        echo ""
        echo "Uso:"
        echo "  ./bot_control.sh start   - Iniciar bot"
        echo "  ./bot_control.sh stop    - Parar bot"
        echo "  ./bot_control.sh restart - Reiniciar bot"
        echo "  ./bot_control.sh status  - Verificar status"
        echo "  ./bot_control.sh logs    - Ver logs"
        ;;
esac
