#!/usr/bin/env python3
"""
ENVIO DIRETO PARA TELEGRAM
"""
import requests
import sys
import time
from datetime import datetime

TOKEN = "8882917542:AAF1IjODcd8JiyBM0W2BrUkpT46YbWunvqs"
CHAT_ID = "920417229"

def send_message(text):
    """Envia mensagem para o Telegram"""
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }
    try:
        response = requests.post(url, data=data, timeout=10)
        result = response.json()
        if result.get("ok"):
            print("✅ Mensagem enviada com sucesso!")
            return True
        else:
            print(f"❌ Erro: {result}")
            return False
    except Exception as e:
        print(f"❌ Erro ao enviar: {e}")
        return False

def send_alert(title, priority, source, message):
    """Envia alerta formatado"""
    emojis = {
        "critical": "🚨🔴",
        "high": "⚠️🟠",
        "medium": "📢🟡",
        "low": "ℹ️🔵"
    }
    emoji = emojis.get(priority, "🔵")
    
    text = f"""{emoji} <b>ALERTA DE SEGURANÇA!</b> {emoji}

<b>📌 Incidente:</b> {title}
<b>⚠️ Prioridade:</b> {priority}
<b>📍 Origem:</b> {source}
<b>🕐 Hora:</b> {datetime.now().strftime('%H:%M:%S')}
<b>📅 Data:</b> {datetime.now().strftime('%d/%m/%Y')}

📝 <b>Detalhes:</b>
{message}

🔗 <a href='http://localhost:3000/incidentes'>📊 Ver no sistema</a>

<a href='https://img.icons8.com/color/96/000000/security-checked--v1.png'>&#8205;</a>"""
    
    return send_message(text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python3 send_telegram.py test")
        print("  python3 send_telegram.py alert \"Título\" \"prioridade\" \"IP\" \"Mensagem\"")
        sys.exit(1)
    
    if sys.argv[1] == "test":
        send_alert("🧪 Teste do Sistema", "critical", "Sistema", "Teste de conexão realizado com sucesso!")
    else:
        title = sys.argv[2] if len(sys.argv) > 2 else "Alerta"
        priority = sys.argv[3] if len(sys.argv) > 3 else "critical"
        source = sys.argv[4] if len(sys.argv) > 4 else "Desconhecido"
        message = sys.argv[5] if len(sys.argv) > 5 else "Incidente detectado"
        send_alert(title, priority, source, message)
