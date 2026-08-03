#!/bin/bash

echo "🔨 Construindo backend..."
docker compose build backend --no-cache

echo "🚀 Executando backend..."
docker compose up backend
