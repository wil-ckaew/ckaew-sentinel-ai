#!/bin/bash

echo "🔔 TESTE DE ALERTA COM SOM E EFEITOS VISUAIS"
echo "============================================="
echo ""

echo "🚨 Gerando alertas de teste..."

# Gerar alerta crítico
curl -s -X POST http://localhost:8080/api/security/logs \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "TEST_ALERT",
    "severity": "critical",
    "message": "🚨 TESTE DE ALERTA COM SOM! Acesso não autorizado detectado",
    "source_ip": "192.168.1.100"
  }' > /dev/null

sleep 2

# Gerar alerta de malware
curl -s -X POST http://localhost:8080/api/security/logs \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "MALWARE_TEST",
    "severity": "critical",
    "message": "🦠 TESTE DE MALWARE! Arquivo malicioso detectado",
    "source_ip": "DESKTOP-TEST-01"
  }' > /dev/null

echo ""
echo "✅ Alertas gerados! Você deve ouvir o som e ver a notificação!"
echo "🔴 O sistema irá:"
echo "  🔊 Tocar som de alerta (3 tons)"
echo "  💥 Piscar a tela em vermelho"
echo "  📱 Mostrar notificação no navegador"
echo "  🚨 Exibir popup de alerta"
echo ""
echo "🌐 Acesse: http://localhost:3000"
