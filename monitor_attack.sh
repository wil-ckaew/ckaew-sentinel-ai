#!/bin/bash

echo "🔍 MONITORANDO ALERTAS EM TEMPO REAL"
echo "===================================="
echo ""

while true; do
    clear
    echo "📊 ALERTAS EM TEMPO REAL - $(date '+%H:%M:%S')"
    echo "============================================="
    echo ""
    
    # Buscar alertas
    curl -s http://localhost:8080/api/alerts | jq -r '.alerts[] | "\(.priority) | \(.title) | \(.status)"' 2>/dev/null | head -10
    
    echo ""
    echo "🔄 Atualizando a cada 5 segundos..."
    sleep 5
done
