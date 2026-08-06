#!/bin/bash

echo "🔧 Configurando agente CKAEW..."

# Criar diretório de configuração
mkdir -p agent/config

# Copiar configuração
cp agent/config.toml agent/config/config.toml

# Atualizar URL do servidor se necessário
SERVER_URL=${1:-"http://backend:8080"}
sed -i "s|server_url = .*|server_url = \"$SERVER_URL\"|" agent/config/config.toml

echo "✅ Agente configurado com URL: $SERVER_URL"
