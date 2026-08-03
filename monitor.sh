#!/bin/bash

echo "📊 MONITORANDO SISTEMA EM TEMPO REAL"
echo "===================================="
echo ""
echo "Pressione Ctrl+C para parar"
echo ""

while true; do
    clear
    echo "📊 CKAEW Sentinel AI - Monitoramento em Tempo Real"
    echo "=================================================="
    echo "⏰ $(date '+%H:%M:%S')"
    echo ""
    
    # Backend
    echo "📡 Backend:"
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health)
    if [ "$HEALTH" = "200" ]; then
        echo "  ✅ Status: Online (HTTP $HEALTH)"
    else
        echo "  ❌ Status: Offline (HTTP $HEALTH)"
    fi
    
    # Assets
    ASSETS=$(curl -s http://localhost:8080/api/assets | jq '.total' 2>/dev/null)
    echo "  📦 Ativos: $ASSETS"
    
    # Logs
    LOGS=$(curl -s http://localhost:8080/api/security/logs | jq '.total' 2>/dev/null)
    echo "  📝 Logs: $LOGS"
    
    # Stats
    STATS=$(curl -s http://localhost:8080/api/security/logs/stats 2>/dev/null)
    CRITICAL=$(echo $STATS | jq '.critical' 2>/dev/null)
    echo "  🔴 Logs Críticos: $CRITICAL"
    
    # Alerts
    ALERTS=$(curl -s http://localhost:8080/api/alerts | jq '.total' 2>/dev/null)
    echo "  🚨 Alertas: $ALERTS"
    
    echo ""
    echo "🖥️ Frontend:"
    WEB=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    if [ "$WEB" = "200" ]; then
        echo "  ✅ Status: Online (HTTP $WEB)"
    else
        echo "  ❌ Status: Offline (HTTP $WEB)"
    fi
    
    echo ""
    echo "🔄 Atualizando a cada 5 segundos..."
    sleep 5
done
