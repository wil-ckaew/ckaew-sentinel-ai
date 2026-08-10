#!/bin/bash
# ============================================
# MONITORAMENTO CONTÍNUO DE ALERTAS
# ============================================

echo "🚀 Iniciando monitoramento contínuo de alertas..."
echo "📱 Enviando alertas para o Telegram..."

while true; do
    ./scripts/monitor_alerts.sh
    sleep 30  # Verificar a cada 30 segundos
done
