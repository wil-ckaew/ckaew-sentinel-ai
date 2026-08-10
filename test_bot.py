import requests
import time

TOKEN = "8882917542:AAF1IjODcd8JiyBM0W2BrUkpT46YbWunvqs"
CHAT_ID = "920417229"

def send_message(text):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = {"chat_id": CHAT_ID, "text": text}
    r = requests.post(url, data=data)
    print(f"Enviado: {text[:50]}... Status: {r.status_code}")
    return r.json()

# Enviar mensagem de teste
send_message("🤖 Bot de teste ativado!\n\nEnvie /help para comandos.")

print("✅ Mensagem de teste enviada!")
print("📱 Verifique seu Telegram!")
