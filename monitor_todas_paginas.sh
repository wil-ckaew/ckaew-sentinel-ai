#!/bin/bash

echo "🔄 MONITORANDO TODAS AS PÁGINAS EM TEMPO REAL"
echo "=============================================="
echo ""
echo "Pressione Ctrl+C para parar"
echo ""

while true; do
    clear
    echo "📊 DADOS EM TEMPO REAL - $(date '+%H:%M:%S')"
    echo "=============================================="
    echo ""
    
    # Dashboard
    echo "📊 Dashboard:"
    curl -s http://localhost:8080/api/dashboard/stats | jq '.'
    echo ""
    
    # Incidentes
    echo "🚨 Incidentes:"
    TOTAL=$(curl -s http://localhost:8080/api/alerts | jq '.total')
    echo "   Total: $TOTAL"
    echo ""
    
    # Ativos
    echo "📦 Ativos:"
    TOTAL=$(curl -s http://localhost:8080/api/assets | jq '.total')
    echo "   Total: $TOTAL"
    echo ""
    
    # Logs
    echo "📝 Logs:"
    TOTAL=$(curl -s http://localhost:8080/api/security/logs | jq '.total')
    echo "   Total: $TOTAL"
    echo ""
    
    echo "🔄 Atualizando a cada 5 segundos..."
    sleep 5
done
