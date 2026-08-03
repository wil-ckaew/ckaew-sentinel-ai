#!/bin/bash

echo "🖥️ Construindo Web Dashboard..."

cd web-dashboard

# Limpar cache
rm -rf node_modules package-lock.json .next

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build
echo "🔨 Buildando..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído!"
    echo "🚀 Iniciando servidor..."
    npm start
else
    echo "❌ Build falhou"
    exit 1
fi
