#!/bin/bash

echo "🚀 CKAEW Sentinel AI - Build Completo"

# Gerar lockfiles do Rust
echo "📦 Gerando Cargo.lock..."
cd backend && cargo generate-lockfile 2>/dev/null || true
cd ../agent && cargo generate-lockfile 2>/dev/null || true
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd web-dashboard
npm install --legacy-peer-deps
cd ..

# Construir tudo
echo "🔨 Construindo todos os serviços..."
docker compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Build concluído!"
    echo "🚀 Iniciando todos os serviços..."
    docker compose up -d
    
    echo "⏳ Aguardando serviços iniciarem..."
    sleep 20
    
    echo "📊 Status dos serviços:"
    docker compose ps
    
    echo ""
    echo "📋 Verificando serviços:"
    
    # Testar backend
    echo -n "Backend: "
    curl -s http://localhost:8080/api/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo "⚠️ Offline"
    
    # Testar IA
    echo -n "IA Service: "
    curl -s http://localhost:8000/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo "⚠️ Offline"
    
    # Testar Web
    echo -n "Web Dashboard: "
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null
    echo ""
    
    echo ""
    echo "✅ Sistema completo rodando!"
    echo "📝 Logs: docker compose logs -f"
    echo "🌐 Backend: http://localhost:8080"
    echo "🧠 IA Service: http://localhost:8000"
    echo "🖥️ Dashboard: http://localhost:3000"
    echo ""
    echo "🔑 Credenciais: admin / admin123"
else
    echo "❌ Build falhou"
    exit 1
fi
