#!/bin/bash

echo "🚀 CKAEW Sentinel AI - Build com Rust Latest"

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

# Limpar cache do Docker
echo "🧹 Limpando cache do Docker..."
docker system prune -f

# Construir com cache limpo
echo "🔨 Construindo containers com Rust latest..."
docker compose build --no-cache

# Verificar se build foi bem sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "🚀 Iniciando containers..."
    docker compose up -d
    
    echo "⏳ Aguardando sistema iniciar..."
    sleep 10
    
    # Verificar status
    echo "📊 Verificando status dos containers..."
    docker compose ps
    
    # Testar sistema
    echo "🧪 Testando sistema..."
    curl -s http://localhost:8080/api/health | jq . || echo "⚠️ Sistema ainda iniciando..."
    
    echo "📋 Logs do backend:"
    docker logs --tail 20 sentinel-backend
    
    echo ""
    echo "✅ Sistema rodando!"
    echo "Para ver logs: docker compose logs -f"
else
    echo "❌ Build falhou"
    echo "Verificando logs do build..."
    docker compose build --no-cache 2>&1 | tail -50
    exit 1
fi
