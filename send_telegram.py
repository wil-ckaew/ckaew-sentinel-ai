#!/usr/bin/env python3
"""
ENVIO DIRETO PARA TELEGRAM
"""
import requests
import sys
import os
import time
from datetime import datetime

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "").strip()

def send_message(text):
    """Envia mensagem para o Telegram"""
    if not TOKEN or not CHAT_ID:
        print("Erro: configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no .env")
        return False
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
            print(f"Falha no envio ao Telegram (HTTP {response.status_code}).")
            return False
    except Exception as e:
        print(f"Falha no envio ao Telegram: {type(e).__name__}")
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
        print('  python3 send_telegram.py alert "Título" "prioridade" "IP" "Mensagem"')
        sys.exit(2)

    if sys.argv[1] == "test":
        success = send_alert(
            "Teste do Sistema",
            "critical",
            "Sistema",
            "Teste de conexão solicitado pelo administrador."
        )
    elif sys.argv[1] == "alert":
        title = sys.argv[2] if len(sys.argv) > 2 else "Alerta"
        priority = sys.argv[3] if len(sys.argv) > 3 else "critical"
        source = sys.argv[4] if len(sys.argv) > 4 else "Desconhecido"
        message = sys.argv[5] if len(sys.argv) > 5 else "Incidente detectado"
        success = send_alert(title, priority, source, message)
    else:
        print("Comando não reconhecido.")
        sys.exit(2)

    sys.exit(0 if success else 1)
