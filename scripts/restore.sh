#!/bin/bash
# ============================================
# RESTAURAÇÃO - CKAEW SENTINEL AI
# ============================================

BACKUP_DIR="./backups"

if [ -z "$1" ]; then
    echo "❌ Uso: ./restore.sh <arquivo_backup.sql.gz>"
    echo ""
    echo "📂 Backups disponíveis:"
    ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
    exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Arquivo não encontrado: $BACKUP_FILE"
    echo ""
    echo "📂 Backups disponíveis:"
    ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
    exit 1
fi

echo "⚠️  ATENÇÃO: Isso irá sobrescrever o banco de dados atual!"
read -p "Deseja continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada."
    exit 1
fi

echo "🔄 Restaurando banco de dados a partir de $BACKUP_FILE..."

gunzip -c $BACKUP_FILE | docker exec -i sentinel-db psql -U postgres sentinel_ai

if [ $? -eq 0 ]; then
    echo "✅ Restauração concluída com sucesso!"
else
    echo "❌ Falha na restauração!"
    exit 1
fi
