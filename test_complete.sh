#!/bin/bash
# ============================================
# TESTE COMPLETO DO SISTEMA
# ============================================

echo "🧪 TESTE COMPLETO DO SISTEMA DE ALERTAS"
echo "======================================="
echo ""

# 1. Testar envio direto
echo "1️⃣ Testando envio direto..."
python3 send_telegram.py test
echo ""

# 2. Gerar alerta no sistema
echo "2️⃣ Gerando alerta no sistema..."
curl -s -X POST http://localhost:8080/api/security/logs \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "TESTE_COMPLETO",
    "severity": "critical",
    "message": "🚨 TESTE COMPLETO DO SISTEMA DE ALERTAS!",
    "source_ip": "192.168.1.100"
  }'
echo ""
echo "✅ Alerta gerado!"

# 3. Aguardar processamento
echo ""
echo "⏳ Aguardando 5 segundos..."
sleep 5

# 4. Verificar logs
echo ""
echo "📋 Logs do monitor:"
tail -5 monitor.log

echo ""
echo "✅ Teste concluído!"
echo "📱 Verifique seu Telegram!"
