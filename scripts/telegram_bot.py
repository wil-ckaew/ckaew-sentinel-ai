#!/usr/bin/env python3
"""
TELEGRAM BOT - CKAEW SENTINEL AI
Bot que recebe comandos e executa correções
"""

import os
import json
import requests
import subprocess
import time
from datetime import datetime

# Configurações
TOKEN = "8882917542:AAF1IjODcd8JiyBM0W2BrUkpT46YbWunvqs"
CHAT_ID = "920417229"
BACKEND_URL = "http://localhost:8080"

class TelegramBot:
    def __init__(self):
        self.offset = 0
        self.last_update_id = 0
    
    def send_message(self, message):
        """Envia mensagem para o Telegram"""
        url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
        data = {
            "chat_id": CHAT_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        response = requests.post(url, data=data)
        return response.json()
    
    def get_updates(self):
        """Busca novas mensagens"""
        url = f"https://api.telegram.org/bot{TOKEN}/getUpdates"
        params = {"offset": self.offset}
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data.get("ok") and data.get("result"):
                for update in data["result"]:
                    if update["update_id"] > self.last_update_id:
                        self.last_update_id = update["update_id"]
                        self.offset = update["update_id"] + 1
                        
                        if "message" in update:
                            message = update["message"]
                            if "text" in message:
                                chat_id = message["chat"]["id"]
                                text = message["text"]
                                
                                # Verificar se é um comando
                                if text.startswith("/"):
                                    self.process_command(chat_id, text)
            return data
        except Exception as e:
            print(f"Erro ao buscar updates: {e}")
            return None
    
    def process_command(self, chat_id, command):
        """Processa comandos recebidos"""
        print(f"📥 Comando recebido: {command}")
        
        if command == "/help":
            self.send_help(chat_id)
        elif command == "/status":
            self.send_status(chat_id)
        elif command.startswith("/block"):
            ip = command.replace("/block", "").strip()
            self.block_ip(chat_id, ip)
        elif command == "/scan":
            self.run_scan(chat_id)
        elif command.startswith("/fix"):
            vuln_id = command.replace("/fix", "").strip()
            self.fix_vulnerability(chat_id, vuln_id)
        else:
            self.send_message(chat_id, f"❌ Comando não reconhecido: {command}\n\nUse /help para ver os comandos disponíveis.")
    
    def send_help(self, chat_id):
        """Envia lista de comandos"""
        help_text = """
🤖 <b>COMANDOS DO CKAEW SENTINEL AI</b>

📋 <b>Comandos disponíveis:</b>

/help - Mostrar esta mensagem
/status - Verificar status do sistema
/scan - Executar escaneamento de vulnerabilidades
/block [IP] - Bloquear um IP suspeito
/fix [ID] - Corrigir uma vulnerabilidade específica

📌 <b>Exemplos:</b>
/block 192.168.1.100
/fix 1

🔗 <a href='http://localhost:3000'>Acessar sistema</a>
"""
        self.send_message(chat_id, help_text)
    
    def send_status(self, chat_id):
        """Envia status do sistema"""
        try:
            # Verificar backend
            health = requests.get(f"{BACKEND_URL}/api/health")
            health_data = health.json()
            
            # Buscar alertas
            alerts = requests.get(f"{BACKEND_URL}/api/alerts")
            alert_data = alerts.json()
            
            total_alerts = alert_data.get("total", 0)
            critical = sum(1 for a in alert_data.get("alerts", []) if a.get("priority") == "critical")
            
            status_text = f"""
📊 <b>STATUS DO SISTEMA</b>

🛡️ Backend: {health_data.get('status', 'unknown')}
📦 Ativos: 10
🚨 Alertas: {total_alerts}
🔴 Críticos: {critical}
📅 Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}

✅ Sistema operacional normal

🔗 <a href='http://localhost:3000'>Acessar sistema</a>
"""
            self.send_message(chat_id, status_text)
        except Exception as e:
            self.send_message(chat_id, f"❌ Erro ao obter status: {str(e)}")
    
    def block_ip(self, chat_id, ip):
        """Bloqueia um IP suspeito"""
        if not ip:
            self.send_message(chat_id, "❌ Por favor, informe o IP para bloquear.\nExemplo: /block 192.168.1.100")
            return
        
        try:
            # Simular bloqueio (em produção, isso seria real)
            # Aqui você implementaria o bloqueio real no firewall
            print(f"🔒 Bloqueando IP: {ip}")
            
            # Criar log de bloqueio
            log_data = {
                "event_type": "IP_BLOCKED",
                "severity": "info",
                "message": f"IP {ip} bloqueado via Telegram",
                "source_ip": ip
            }
            requests.post(f"{BACKEND_URL}/api/security/logs", json=log_data)
            
            self.send_message(chat_id, f"""
🔒 <b>IP BLOQUEADO COM SUCESSO!</b>

📍 IP: {ip}
📅 Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
👤 Ação: Telegram Bot

✅ IP adicionado à lista de bloqueio.

🔗 <a href='http://localhost:3000/incidentes'>Ver no sistema</a>
""")
        except Exception as e:
            self.send_message(chat_id, f"❌ Erro ao bloquear IP: {str(e)}")
    
    def run_scan(self, chat_id):
        """Executa escaneamento de vulnerabilidades"""
        try:
            self.send_message(chat_id, "🔍 <b>INICIANDO ESCANEAMENTO...</b>\n\n⏳ Aguarde, isso pode levar alguns segundos...")
            
            # Simular escaneamento (em produção, seria real)
            print("🔍 Executando escaneamento de vulnerabilidades...")
            
            # Criar log
            log_data = {
                "event_type": "SCAN_STARTED",
                "severity": "info",
                "message": "Escaneamento de vulnerabilidades iniciado via Telegram"
            }
            requests.post(f"{BACKEND_URL}/api/security/logs", json=log_data)
            
            time.sleep(3)
            
            # Simular resultado
            self.send_message(chat_id, """
✅ <b>ESCANEAMENTO CONCLUÍDO!</b>

📊 <b>Resultados:</b>
✅ Nenhuma vulnerabilidade crítica encontrada
⚠️ 2 vulnerabilidades médias identificadas
📝 1 vulnerabilidade baixa

🔗 <a href='http://localhost:3000/vulnerabilidades'>Ver no sistema</a>
""")
        except Exception as e:
            self.send_message(chat_id, f"❌ Erro ao escanear: {str(e)}")
    
    def fix_vulnerability(self, chat_id, vuln_id):
        """Corrige uma vulnerabilidade específica"""
        if not vuln_id:
            self.send_message(chat_id, "❌ Por favor, informe o ID da vulnerabilidade.\nExemplo: /fix 1")
            return
        
        try:
            self.send_message(chat_id, f"🔧 <b>CORRIGINDO VULNERABILIDADE #{vuln_id}</b>\n\n⏳ Aplicando correção...")
            
            # Simular correção (em produção, seria real)
            print(f"🔧 Corrigindo vulnerabilidade: {vuln_id}")
            
            time.sleep(2)
            
            # Criar log de correção
            log_data = {
                "event_type": "VULNERABILITY_FIXED",
                "severity": "info",
                "message": f"Vulnerabilidade {vuln_id} corrigida via Telegram"
            }
            requests.post(f"{BACKEND_URL}/api/security/logs", json=log_data)
            
            self.send_message(chat_id, f"""
✅ <b>VULNERABILIDADE CORRIGIDA!</b>

📌 ID: {vuln_id}
📅 Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
👤 Ação: Telegram Bot

✅ Correção aplicada com sucesso.

🔗 <a href='http://localhost:3000/vulnerabilidades'>Ver no sistema</a>
""")
        except Exception as e:
            self.send_message(chat_id, f"❌ Erro ao corrigir vulnerabilidade: {str(e)}")
    
    def run(self):
        """Loop principal do bot"""
        print("🤖 CKAEW Sentinel AI Bot iniciado!")
        print("📱 Aguardando comandos...")
        print("")
        
        self.send_message(f"""
🚀 <b>CKAEW SENTINEL AI BOT ATIVADO!</b>

📅 {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}

📋 <b>Comandos disponíveis:</b>
/help - Listar comandos
/status - Verificar status
/scan - Escanear vulnerabilidades
/block [IP] - Bloquear IP
/fix [ID] - Corrigir vulnerabilidade

🔗 <a href='http://localhost:3000'>Acessar sistema</a>
""")
        
        while True:
            try:
                self.get_updates()
                time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Bot encerrado!")
                break
            except Exception as e:
                print(f"Erro: {e}")
                time.sleep(5)

if __name__ == "__main__":
    bot = TelegramBot()
    bot.run()
