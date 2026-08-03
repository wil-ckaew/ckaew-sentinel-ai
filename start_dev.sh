#!/bin/bash

echo "🚀 Iniciando CKAEW Sentinel AI (Modo Desenvolvimento)"
echo "======================================================"
echo ""

# 1. Parar containers que podem conflitar
echo "🛑 Parando containers..."
docker compose down 2>/dev/null || true

# 2. Subir serviços auxiliares (db, ai-service)
echo "📦 Subindo serviços auxiliares..."
docker compose up -d db ai-service

# 3. Iniciar backend Rust em modo desenvolvimento
echo "🦀 Iniciando backend Rust..."
cd backend
cargo run &
cd ..

# 4. Aguardar backend
sleep 5

# 5. Testar backend
echo "🔍 Testando backend..."
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend rodando"
else
    echo "❌ Backend falhou"
    exit 1
fi

# 6. Subir frontend
echo "🖥️ Iniciando frontend..."
docker compose up -d web-dashboard

# 7. Aguardar frontend
sleep 5

# 8. Testar frontend
echo "🔍 Testando frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend rodando"
else
    echo "❌ Frontend falhou"
    exit 1
fi

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "🔑 Credenciais: admin / admin123"
echo ""
echo "📋 Para parar o backend: Ctrl+C"
echo "   (ou pkill -f ckaew-sentinel-ai)"
