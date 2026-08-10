#!/bin/bash
# ============================================
# BACKUP AUTOMÁTICO - CKAEW SENTINEL AI
# ============================================

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "🔄 Iniciando backup do banco de dados..."

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Verificar se o container está rodando
if ! docker ps | grep -q sentinel-db; then
    echo "❌ Container sentinel-db não está rodando!"
    exit 1
fi

# Realizar backup
docker exec sentinel-db pg_dump -U postgres sentinel_ai > "$BACKUP_DIR/backup_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup concluído: backup_$DATE.sql"
    
    # Compactar
    gzip -f "$BACKUP_DIR/backup_$DATE.sql"
    echo "✅ Arquivo compactado: backup_$DATE.sql.gz"
    
    # Remover backups antigos
    find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    echo "✅ Backups com mais de $RETENTION_DAYS dias removidos"
    
    # Mostrar status
    echo ""
    echo "📊 Status do backup:"
    ls -lh $BACKUP_DIR/ | tail -5
else
    echo "❌ Falha no backup!"
    exit 1
fi
