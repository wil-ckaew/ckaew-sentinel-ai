#!/bin/bash
# ============================================
# INSTALAÇÃO DE DEPENDÊNCIAS - CKAEW SENTINEL AI
# ============================================

echo "📦 Instalando dependências do sistema..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado! Instalando..."
    sudo apt-get install python3 python3-pip -y
fi

# Verificar pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 não encontrado! Instalando..."
    sudo apt-get install python3-pip -y
fi

# Criar ambiente virtual (recomendado)
echo "🔧 Criando ambiente virtual..."
cd ~/rust/ckaew-sentinel-ai

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Ambiente virtual criado!"
else
    echo "✅ Ambiente virtual já existe!"
fi

# Ativar ambiente virtual e instalar dependências
echo "📦 Instalando dependências..."
source venv/bin/activate
pip install --upgrade pip
pip install -r scripts/requirements.txt

# Verificar instalação
echo "✅ Verificando instalação..."
python3 -c "import requests; print('✅ requests instalado')"
python3 -c "import telegram; print('✅ python-telegram-bot instalado')"

echo ""
echo "✅ DEPENDÊNCIAS INSTALADAS COM SUCESSO!"
echo ""
echo "📌 Para ativar o ambiente virtual:"
echo "   source venv/bin/activate"
echo ""
echo "📌 Para executar o bot:"
echo "   python3 scripts/telegram_bot_completo.py"
