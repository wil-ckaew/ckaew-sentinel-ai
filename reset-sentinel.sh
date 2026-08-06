#!/bin/bash

# Entrar no diretório do projeto
cd ~/rust/ckaew-sentinel-ai || { echo "Erro: Diretório não encontrado."; exit 1; }

# Parar e remover containers, volumes E IMAGENS do projeto
echo "Parando containers, removendo volumes e imagens do projeto..."
docker compose down -v --rmi all

# Remover containers específicos se ainda existirem
echo "Limpando containers problemáticos..."
docker rm -f sentinel-web sentinel-backend sentinel-agent 2>/dev/null

# Limpar todo o cache e ecossistema Docker não utilizado
echo "Limpando cache do Docker..."
docker system prune -af

# Reconstruir e subir as aplicações do zero
echo "Reconstruindo e iniciando os serviços..."
docker compose up -d --build

# Aguardar inicialização
echo "Aguardando 30 segundos para os serviços inicializarem..."
sleep 30

# Verificar status final dos containers
echo "Status dos containers:"
docker compose ps