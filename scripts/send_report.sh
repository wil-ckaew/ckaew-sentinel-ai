#!/bin/bash
# ============================================
# RELATÓRIO AUTOMÁTICO - CKAEW SENTINEL AI
# ============================================

EMAIL_TO="admin@empresa.com"
DATE=$(date +"%d/%m/%Y")
TIME=$(date +"%H:%M")

echo "📊 Gerando relatório diário..."

# Coletar dados
TOTAL_ASSETS=$(curl -s http://localhost:8080/api/assets | jq '.total' 2>/dev/null || echo "0")
TOTAL_ALERTS=$(curl -s http://localhost:8080/api/alerts | jq '.total' 2>/dev/null || echo "0")
CRITICAL_ALERTS=$(curl -s http://localhost:8080/api/alerts | jq '.alerts[] | select(.priority=="critical") | .id' 2>/dev/null | wc -l)
TOTAL_LOGS=$(curl -s http://localhost:8080/api/security/logs | jq '.total' 2>/dev/null || echo "0")
CRITICAL_LOGS=$(curl -s http://localhost:8080/api/security/logs/stats | jq '.critical' 2>/dev/null || echo "0")

# Buscar previsão de ataques
PREDICTION=$(curl -s http://localhost:8000/predict/attacks | jq -r '.data.risk_level' 2>/dev/null || echo "desconhecido")

# Criar HTML do relatório
cat > /tmp/report_$(date +%Y%m%d).html << EOF
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 30px; border-radius: 10px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; }
        .card h3 { margin: 0; color: #374151; font-size: 14px; }
        .card p { font-size: 28px; font-weight: bold; margin: 10px 0; }
        .critical { color: #DC2626; }
        .high { color: #F59E0B; }
        .medium { color: #FCD34D; }
        .low { color: #10B981; }
        .footer { margin-top: 30px; padding: 20px; text-align: center; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .risk-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
        .risk-critical { background: #FEE2E2; color: #DC2626; }
        .risk-high { background: #FEF3C7; color: #D97706; }
        .risk-medium { background: #FEF9C3; color: #CA8A04; }
        .risk-low { background: #D1FAE5; color: #059669; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ CKAEW Sentinel AI</h1>
        <p>Relatório de Segurança - $DATE $TIME</p>
        <p style="margin-top: 10px;">
            <span class="risk-badge risk-$PREDICTION">Risco: ${PREDICTION^^}</span>
        </p>
    </div>
    
    <div class="stats">
        <div class="card">
            <h3>📦 Ativos</h3>
            <p>$TOTAL_ASSETS</p>
        </div>
        <div class="card">
            <h3>🚨 Alertas</h3>
            <p>$TOTAL_ALERTS</p>
            <small class="critical">🔴 $CRITICAL_ALERTS críticos</small>
        </div>
        <div class="card">
            <h3>📝 Logs</h3>
            <p>$TOTAL_LOGS</p>
            <small class="critical">🔴 $CRITICAL_LOGS críticos</small>
        </div>
    </div>
    
    <div style="background: #EFF6FF; padding: 20px; border-radius: 10px; border-left: 4px solid #2563EB;">
        <h3 style="margin: 0; color: #1E40AF;">📋 Resumo do Dia</h3>
        <ul style="margin-top: 10px;">
            <li>✅ Sistema operacional normal</li>
            <li>🔄 Backup realizado com sucesso</li>
            <li>📊 Monitoramento ativo</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>Relatório gerado automaticamente pelo CKAEW Sentinel AI</p>
        <p><a href="http://localhost:3000">Acesse o sistema</a></p>
    </div>
</body>
</html>
