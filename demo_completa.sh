#!/bin/bash
# ============================================
# DEMONSTRAÇÃO COMPLETA - CKAEW SENTINEL AI
# ============================================

echo "🚀 INICIANDO DEMONSTRAÇÃO COMPLETA"
echo "=================================="
echo ""

# 1. Verificar sistema
echo "📡 1. Verificando serviços..."
docker compose ps

# 2. Testar endpoints
echo ""
echo "🔍 2. Testando endpoints..."
curl -s http://localhost:8080/api/health | jq '.'

# 3. Gerar alerta de teste
echo ""
echo "🚨 3. Gerando alerta de teste..."
curl -X POST http://localhost:8080/api/security/logs \
  -H "Content-Type: application/json" \
  -d '{"event_type":"DEMO","severity":"critical","message":"🔴 Alerta de demonstração!","source_ip":"192.168.1.100"}' 2>/dev/null
echo "✅ Alerta gerado!"

# 4. Enviar Telegram
echo ""
echo "📱 4. Enviando alerta para Telegram..."
./scripts/telegram_alerts.sh alert "Demonstração" "Crítico" "192.168.1.100" "$(date +%H:%M:%S)" "Sistema funcionando!"

# 5. Fazer backup
echo ""
echo "💾 5. Fazendo backup..."
./backup.sh

# 6. Health check
echo ""
echo "❤️ 6. Health check..."
./healthcheck.sh

echo ""
echo "✅ DEMONSTRAÇÃO CONCLUÍDA!"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "🔑 admin / admin123"
echo "📱 Telegram: @ckaew_sentinel_bot"
