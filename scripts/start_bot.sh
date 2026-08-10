#!/bin/bash
# ============================================
# INICIAR BOT TELEGRAM - CKAEW SENTINEL AI
# ============================================

cd ~/rust/ckaew-sentinel-ai

# Ativar ambiente virtual se existir
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Ambiente virtual ativado"
fi

# Verificar dependências
if ! python3 -c "import requests" 2>/dev/null; then
    echo "⚠️  Dependências não encontradas!"
    echo "📦 Executando instalação..."
    ./scripts/install_dependencies.sh
fi

# Verificar se o bot já está rodando
if pgrep -f "telegram_bot_completo.py" > /dev/null; then
    echo "✅ Bot já está rodando!"
    exit 0
fi

# Iniciar o bot
echo "🤖 Iniciando bot Telegram..."
nohup python3 scripts/telegram_bot_completo.py > telegram_bot_completo.log 2>&1 &

sleep 2

# Verificar se iniciou
if pgrep -f "telegram_bot_completo.py" > /dev/null; then
    echo "✅ Bot iniciado com sucesso!"
    echo "📱 Envie /help no Telegram para testar"
else
    echo "❌ Falha ao iniciar o bot"
    tail -10 telegram_bot_completo.log
fi
