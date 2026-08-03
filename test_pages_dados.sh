#!/bin/bash

echo "🔍 TESTANDO DADOS EM TEMPO REAL DAS PÁGINAS"
echo "============================================"
echo ""

# Função para testar página
test_page() {
    local name=$1
    local path=$2
    local api=$3
    
    echo "📄 $name:"
    echo "  URL: http://localhost:3000$path"
    echo "  API: http://localhost:8080$api"
    
    # Testar API
    if curl -s http://localhost:8080$api > /dev/null 2>&1; then
        DATA=$(curl -s http://localhost:8080$api | jq '.' 2>/dev/null | head -5)
        echo "  ✅ API respondendo:"
        echo "$DATA" | sed 's/^/    /'
    else
        echo "  ❌ API não responde"
    fi
    echo ""
}

# Testar cada página
test_page "Dashboard" "/dashboard" "/api/dashboard/stats"
test_page "Ativos" "/ativos" "/api/assets"
test_page "Incidentes" "/incidentes" "/api/alerts"
test_page "Logs" "/logs" "/api/security/logs"
test_page "Monitoramento" "/monitoramento" "/api/security/logs/stats"

echo "✅ TESTE CONCLUÍDO!"
