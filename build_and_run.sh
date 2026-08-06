#!/bin/bash

echo "🚀 CKAEW Sentinel AI - Build e Deploy"

# Verificar se os diretórios existem
if [ ! -d "backend/src" ] || [ ! -d "agent/src" ]; then
    echo "❌ Estrutura de diretórios incompleta"
    exit 1
fi

# Gerar lockfiles
echo "📦 Gerando Cargo.lock..."
cd backend && cargo generate-lockfile 2>/dev/null || true
cd ../agent && cargo generate-lockfile 2>/dev/null || true
cd ..

# Limpar containers antigos
echo "🧹 Limpando containers antigos..."
docker compose down 2>/dev/null || true

# Construir com cache limpo
echo "🔨 Construindo containers..."
docker compose build --no-cache

# Verificar se build foi bem sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "🚀 Iniciando containers..."
    docker compose up
else
    echo "❌ Build falhou"
    exit 1
fi
