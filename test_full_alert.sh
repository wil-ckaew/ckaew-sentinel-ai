#!/bin/bash
# ============================================
# TESTE COMPLETO - ALERTA + TELEGRAM
# ============================================

echo "🚨 TESTE COMPLETO DO SISTEMA DE ALERTAS"
echo "======================================="
echo ""

# 1. Gerar alerta crítico
echo "1️⃣ Gerando alerta crítico..."
curl -s -X POST http://localhost:8080/api/security/logs \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "TESTE_COMPLETO",
    "severity": "critical",
    "message": "🚨 ALERTA DE TESTE COMPLETO! Sistema funcionando!",
    "source_ip": "192.168.1.100"
  }'

echo ""
echo "✅ Alerta gerado!"

# 2. Aguardar processamento
echo ""
echo "⏳ Aguardando 3 segundos..."
sleep 3

# 3. Executar monitoramento
echo ""
echo "2️⃣ Executando monitoramento..."
./scripts/monitor_alerts.sh

echo ""
echo "✅ Teste concluído!"
echo "📱 Verifique seu Telegram!"
