#!/bin/bash
# ============================================
# MONITORAMENTO EM TEMPO REAL
# ============================================

echo "📊 MONITORANDO SISTEMA EM TEMPO REAL"
echo "===================================="
echo ""

while true; do
    clear
    echo "📊 CKAEW Sentinel AI - $(date '+%H:%M:%S')"
    echo "===================================="
    echo ""
    
    # Backend
    curl -s http://localhost:8080/api/health 2>/dev/null | jq -r '"📡 Backend: \(.status) (v\(.version))"' 2>/dev/null || echo "📡 Backend: ❌ Offline"
    
    # AI Service
    curl -s http://localhost:8000/health 2>/dev/null | jq -r '"🧠 AI Service: \(.status)"' 2>/dev/null || echo "🧠 AI Service: ❌ Offline"
    
    # Frontend
    FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
    if [ "$FRONTEND" = "200" ]; then
        echo "🖥️ Frontend: ✅ Online (HTTP $FRONTEND)"
    else
        echo "🖥️ Frontend: ❌ Offline (HTTP $FRONTEND)"
    fi
    
    # Stats
    echo ""
    echo "📊 Estatísticas:"
    ASSETS=$(curl -s http://localhost:8080/api/assets 2>/dev/null | jq '.total' 2>/dev/null)
    ALERTS=$(curl -s http://localhost:8080/api/alerts 2>/dev/null | jq '.total' 2>/dev/null)
    echo "  📦 Ativos: ${ASSETS:-0}"
    echo "  🚨 Alertas: ${ALERTS:-0}"
    
    echo ""
    echo "🔄 Atualizando a cada 5 segundos..."
    sleep 5
done
