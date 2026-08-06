#!/bin/bash

echo "🚀 INICIANDO DEMONSTRAÇÃO - CKAEW SENTINEL AI"
echo "=============================================="
echo ""
echo "📋 O que será demonstrado:"
echo "  1. Dashboard com métricas em tempo real"
echo "  2. Gerenciamento de incidentes"
echo "  3. Inventário de ativos"
echo "  4. Monitoramento de segurança"
echo "  5. Detecção de ameaças com IA"
echo "  6. Relatórios automatizados"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "🔑 Credenciais: admin / admin123"
echo ""
echo "📊 Dados disponíveis:"
echo "  - Ativos: 10+"
echo "  - Incidentes: 5+"
echo "  - Logs de segurança: 50+"
echo "  - Alertas em tempo real"
echo ""
echo "⏳ Preparando demonstração..."

# Abrir o sistema no navegador
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
else
    echo "   Abra manualmente: http://localhost:3000"
fi

echo ""
echo "✅ Demonstração pronta!"
echo ""
echo "🔄 Monitorando logs em tempo real..."
docker compose logs -f web-dashboard &
