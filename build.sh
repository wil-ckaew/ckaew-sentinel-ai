#!/bin/bash

echo "🚀 Construindo CKAEW Sentinel AI..."

# Parar containers existentes
echo "🛑 Parando containers..."
docker compose down

# Remover imagens antigas (opcional)
# docker rmi ckaew-sentinel-ai-backend ckaew-sentinel-ai-agent

# Construir e subir
echo "🔨 Construindo e subindo containers..."
docker compose up --build

echo "✅ Sistema rodando!"
