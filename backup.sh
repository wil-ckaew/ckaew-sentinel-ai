#!/bin/bash
# ============================================
# BACKUP RÁPIDO - CKAEW SENTINEL AI
# ============================================

echo "🔄 Fazendo backup rápido..."

# Criar diretório
mkdir -p ./backups

# Data
DATE=$(date +%Y%m%d_%H%M%S)

# Verificar se o container está rodando
if ! docker ps | grep -q sentinel-db; then
    echo "❌ Container sentinel-db não está rodando!"
    exit 1
fi

# Backup
docker exec sentinel-db pg_dump -U postgres sentinel_ai > "./backups/backup_$DATE.sql"

if [ $? -eq 0 ]; then
    gzip -f "./backups/backup_$DATE.sql"
    echo "✅ Backup criado: backups/backup_$DATE.sql.gz"
    
    # Manter apenas 7 dias
    find ./backups -name "*.sql.gz" -mtime +7 -delete
    echo "✅ Backups antigos removidos"
else
    echo "❌ Falha no backup!"
    exit 1
fi
