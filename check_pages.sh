#!/bin/bash

echo "🔍 VERIFICANDO TODAS AS PÁGINAS DO SISTEMA"
echo "=========================================="

PAGES=(
  "Dashboard:/dashboard"
  "Incidentes:/incidentes"
  "Ativos:/ativos"
  "Vulnerabilidades:/vulnerabilidades"
  "Monitoramento:/monitoramento"
  "Relatórios:/relatorios"
  "IA Analyst:/ai"
  "Configurações:/configuracoes"
)

echo -e "\n📊 STATUS DAS PÁGINAS:"
for page in "${PAGES[@]}"; do
  name="${page%%:*}"
  path="${page#*:}"
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$path)
  if [ "$status" = "200" ] || [ "$status" = "307" ]; then
    echo "  ✅ $name: OK (HTTP $status)"
  else
    echo "  ❌ $name: Erro (HTTP $status)"
  fi
done

echo -e "\n📡 STATUS DO BACKEND:"
health=$(curl -s http://localhost:8080/api/health | jq -r '.status' 2>/dev/null)
if [ "$health" = "ok" ]; then
  echo "  ✅ Backend: OK"
else
  echo "  ❌ Backend: Offline"
fi

echo -e "\n🔄 TESTANDO LOGIN:"
login=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token' 2>/dev/null)

if [ -n "$login" ] && [ "$login" != "null" ]; then
  echo "  ✅ Login: Funcionando"
else
  echo "  ❌ Login: Falhou"
fi

echo -e "\n✅ VERIFICAÇÃO CONCLUÍDA!"
