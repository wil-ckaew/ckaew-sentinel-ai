#!/bin/bash

echo "🧠 Testando Serviço de IA - CKAEW Sentinel AI"
echo "=============================================="

# Testar health
echo -e "\n1️⃣ Testando health check..."
curl -s http://localhost:8000/health | jq .

# Testar status dos modelos
echo -e "\n2️⃣ Verificando status dos modelos..."
curl -s http://localhost:8000/models/status | jq .

# Treinar modelo de anomalia
echo -e "\n3️⃣ Treinando modelo de detecção de anomalias..."
curl -s -X POST http://localhost:8000/train/anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": [
      {"cpu_usage": 45.5, "memory_usage": 55.2, "disk_usage": 42.1, "network_rx": 5000000, "network_tx": 3000000, "process_count": 80, "load_avg_1": 1.5, "load_avg_5": 1.2, "load_avg_15": 1.1},
      {"cpu_usage": 52.3, "memory_usage": 48.7, "disk_usage": 38.9, "network_rx": 6000000, "network_tx": 3500000, "process_count": 85, "load_avg_1": 1.8, "load_avg_5": 1.4, "load_avg_15": 1.2},
      {"cpu_usage": 38.1, "memory_usage": 62.4, "disk_usage": 45.3, "network_rx": 4000000, "network_tx": 2800000, "process_count": 75, "load_avg_1": 1.2, "load_avg_5": 1.1, "load_avg_15": 1.0}
    ]
  }' | jq .

# Testar detecção de anomalias
echo -e "\n4️⃣ Testando detecção de anomalias..."
curl -s -X POST http://localhost:8000/detect/anomalies/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"cpu_usage": 95.5, "memory_usage": 88.2, "disk_usage": 72.1, "network_rx": 15000000, "network_tx": 8000000, "process_count": 120, "load_avg_1": 4.5, "load_avg_5": 3.2, "load_avg_15": 2.1},
      {"cpu_usage": 42.3, "memory_usage": 52.1, "disk_usage": 40.5, "network_rx": 4500000, "network_tx": 2800000, "process_count": 82, "load_avg_1": 1.6, "load_avg_5": 1.3, "load_avg_15": 1.1}
    ]
  }' | jq .

# Testar classificação de incidente
echo -e "\n5️⃣ Testando classificação de incidente..."
curl -s -X POST http://localhost:8000/classify/incident \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "FAILED_LOGIN",
    "severity": "warning",
    "message": "Multiple failed login attempts from 192.168.1.100",
    "source_ip": "192.168.1.100"
  }' | jq .

echo -e "\n✅ Testes concluídos!"
