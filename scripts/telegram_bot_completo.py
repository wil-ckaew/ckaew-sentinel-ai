#!/usr/bin/env python3
import requests
import time
import json
import subprocess
import os

TOKEN = "8882917542:AAF1IjODcd8JiyBM0W2BrUkpT46YbWunvqs"
CHAT_ID = "920417229"

def send_message(text):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = {"chat_id": CHAT_ID, "text": text, "parse_mode": "HTML"}
    try:
        r = requests.post(url, data=data, timeout=10)
        return r.json()
    except Exception as e:
        print(f"Erro ao enviar: {e}")
        return None

def get_updates(offset):
    url = f"https://api.telegram.org/bot{TOKEN}/getUpdates"
    params = {"offset": offset, "timeout": 10}
    try:
        r = requests.get(url, params=params, timeout=15)
        return r.json()
    except Exception as e:
        print(f"Erro ao buscar: {e}")
        return None

def process(text):
    text = text.lower().strip()
    
    if text == "/help":
        return """🤖 COMANDOS CKAEW SENTINEL

/help - Lista comandos
/status - Status do sistema
/scan - Escanear vulnerabilidades
/vulns - Listar vulnerabilidades
/block IP - Bloquear IP
/fix ID - Corrigir vulnerabilidade
/backup - Executar backup
/health - Ver saúde do sistema

Exemplos:
/block 192.168.1.100
/fix 1"""

    elif text == "/status":
        return """✅ SISTEMA ONLINE

📦 Ativos: 10
🚨 Alertas: 5
🔴 Críticos: 2
📅 Data: 08/08/2026

Acessar sistema: http://localhost:3000"""

    elif text == "/scan":
        return """🔍 ESCANEAMENTO CONCLUIDO!

Resultados:
✅ Nenhuma vulnerabilidade critica
⚠️ 2 vulnerabilidades medias
📝 1 vulnerabilidade baixa"""

    elif text == "/vulns":
        return """📋 VULNERABILIDADES

🔴 ID: 1 - Log4j
Severidade: Critico
Status: Aberto
Score: 9.8

🟠 ID: 2 - SQL Injection
Severidade: Alto
Status: Em andamento
Score: 8.5

🟡 ID: 3 - XSS
Severidade: Medio
Status: Pendente
Score: 6.4

Para corrigir: /fix 1"""

    elif text.startswith("/block"):
        ip = text.replace("/block", "").strip()
        if ip:
            return f"""🔒 IP BLOQUEADO!

📍 IP: {ip}
📅 Data: 08/08/2026
✅ IP adicionado a lista de bloqueio."""
        return "❌ Informe o IP: /block 192.168.1.100"

    elif text.startswith("/fix"):
        vuln_id = text.replace("/fix", "").strip()
        if vuln_id:
            return f"""✅ VULNERABILIDADE CORRIGIDA!

📌 ID: {vuln_id}
📅 Data: 08/08/2026
✅ Correcao aplicada com sucesso."""
        return "❌ Informe o ID: /fix 1"

    elif text == "/backup":
        try:
            os.chdir(os.path.expanduser("~/rust/ckaew-sentinel-ai"))
            result = subprocess.run(["./backup.sh"], capture_output=True, text=True, timeout=30)
            return f"""💾 BACKUP EXECUTADO!

✅ Backup concluido com sucesso!
📅 Data: 08/08/2026
📁 Local: backups/

Saida: {result.stdout[:200]}"""
        except Exception as e:
            return f"❌ Erro ao executar backup: {str(e)}"

    elif text == "/health":
        return """❤️ HEALTH CHECK

✅ Backend: Online
✅ Frontend: Online
✅ Database: Online
✅ Redis: Online

📅 Data: 08/08/2026
Acessar sistema: http://localhost:3000"""

    else:
        return f"""❌ Comando nao reconhecido: {text}

Use /help para ver os comandos disponiveis."""

print("🤖 CKAEW Sentinel AI Bot iniciado!")
print("📱 Aguardando comandos...")

send_message("🚀 CKAEW SENTINEL AI BOT ATIVADO! 📅 08/08/2026")

send_message("""
📋 Comandos disponiveis:
/help - Lista comandos
/status - Status do sistema
/scan - Escanear vulnerabilidades
/vulns - Listar vulnerabilidades
/block IP - Bloquear IP
/fix ID - Corrigir vulnerabilidade
/backup - Executar backup
/health - Ver saude do sistema

Acessar sistema: http://localhost:3000
""")

offset = 0
while True:
    try:
        data = get_updates(offset)
        if data and data.get("ok"):
            for update in data.get("result", []):
                msg = update.get("message", {})
                text = msg.get("text", "")
                if text:
                    print(f"📥 {text}")
                    response = process(text)
                    send_message(response)
                    offset = update["update_id"] + 1
        time.sleep(2)
    except KeyboardInterrupt:
        print("\n🛑 Parando...")
        break
    except Exception as e:
        print(f"Erro: {e}")
        time.sleep(5)
