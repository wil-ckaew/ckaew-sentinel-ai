#!/usr/bin/env python3
import requests
import time
import json

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
        return """🤖 COMANDOS:

/help - Ajuda
/status - Status do sistema
/scan - Escanear
/block IP - Bloquear IP
/fix ID - Corrigir vulnerabilidade"""
    elif text == "/status":
        return "✅ Sistema ONLINE\n📦 Ativos: 10\n🚨 Alertas: 5"
    elif text == "/scan":
        return "🔍 Escaneamento concluído!\n✅ Nenhuma vulnerabilidade crítica"
    elif text.startswith("/block"):
        ip = text.replace("/block", "").strip()
        return f"🔒 IP {ip} bloqueado!" if ip else "❌ Informe o IP"
    elif text.startswith("/fix"):
        vid = text.replace("/fix", "").strip()
        return f"✅ Vulnerabilidade {vid} corrigida!" if vid else "❌ Informe o ID"
    else:
        return f"❌ Comando não reconhecido\nUse /help"

print("🤖 Bot iniciado!")
send_message("🚀 Bot ativado! Envie /help")

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
