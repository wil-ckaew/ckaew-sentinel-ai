#!/bin/bash

echo "🔊 TESTE DE SOM PARA FIREFOX"
echo "============================"
echo ""

echo "1️⃣ Clique no botão 'Ativar Áudio' no site"
echo "2️⃣ Aguarde o bip de confirmação"
echo "3️⃣ Execute o comando abaixo:"
echo ""

echo "curl -X POST http://localhost:8080/api/security/logs \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"event_type\": \"TESTE_SOM_FIREFOX\",
    \"severity\": \"critical\",
    \"message\": \"🔊 TESTE DE ÁUDIO NO FIREFOX!\",
    \"source_ip\": \"192.168.1.100\"
  }'"
