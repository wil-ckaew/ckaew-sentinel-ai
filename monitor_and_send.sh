#!/bin/bash
set -Eeuo pipefail

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
    echo "ERRO: configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no .env."
    exit 1
fi

mkdir -p /app/state

exec python3 -u - <<'PY'
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests

API_URL = "http://backend:8080/api/alerts"
STATE_FILE = Path("/app/state/sent_alerts.json")
POLL_SECONDS = 15
MAX_HISTORY = 5000


def fingerprint(alert):
    """Gera uma identidade estável para um alerta."""
    if not isinstance(alert, dict):
        alert = {"value": str(alert)}

    for field in ("id", "alert_id", "uuid", "event_id"):
        value = alert.get(field)
        if value is not None and str(value).strip():
            identity = f"{field}:{value}"
            return hashlib.sha256(identity.encode()).hexdigest()

    fields = (
        "title", "priority", "source_ip", "message",
        "created_at", "timestamp", "detected_at", "first_seen",
        "event_type", "type"
    )
    payload = {key: alert[key] for key in fields if key in alert}

    if not payload:
        payload = alert

    encoded = json.dumps(
        payload, ensure_ascii=False, sort_keys=True, default=str
    )
    return hashlib.sha256(encoded.encode()).hexdigest()


def save_state(seen):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    data = {"fingerprints": list(seen)[-MAX_HISTORY:]}
    temporary = STATE_FILE.with_suffix(".tmp")
    temporary.write_text(json.dumps(data), encoding="utf-8")
    os.replace(temporary, STATE_FILE)


def load_state():
    if not STATE_FILE.exists():
        return set(), True

    try:
        data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        return set(data.get("fingerprints", [])), False
    except (ValueError, OSError, AttributeError):
        print(
            "ERRO: histórico de alertas inválido. "
            "Monitor não continuará para evitar envios duplicados."
        )
        raise SystemExit(1)


def get_critical_alerts():
    monitor_token = os.getenv("TELEGRAM_MONITOR_TOKEN", "").strip()
    if not monitor_token:
        raise RuntimeError("Token interno do monitor não configurado")
    response = requests.get(
        API_URL,
        headers={"Authorization": f"Bearer {monitor_token}"},
        timeout=10,
    )
    response.raise_for_status()
    body = response.json()
    alerts = body.get("alerts", []) if isinstance(body, dict) else []

    if not isinstance(alerts, list):
        raise ValueError("Formato de alertas inesperado")

    return [
        item for item in alerts
        if isinstance(item, dict)
        and str(item.get("priority", "")).lower() == "critical"
    ]


def send_alert(alert):
    title = str(alert.get("title") or "Alerta crítico")
    source = str(alert.get("source_ip") or "Desconhecido")
    message = str(alert.get("message") or "Alerta detectado")

    try:
        result = subprocess.run(
            [
                sys.executable,
                "/app/send_telegram.py",
                "alert",
                title,
                "critical",
                source,
                message,
            ],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except subprocess.TimeoutExpired:
        print("Envio expirou; o alerta será tentado novamente.")
        return False
    except OSError as exc:
        print(f"Falha ao iniciar o envio: {type(exc).__name__}")
        return False

    if result.returncode == 0:
        print("Alerta crítico enviado ao Telegram.")
        return True

    print("Falha no envio; o alerta será tentado novamente.")
    return False


seen, baseline_pending = load_state()
print("Monitor do Telegram iniciado.")
print("Deduplicação persistente habilitada.")

while True:
    try:
        critical_alerts = get_critical_alerts()

        if baseline_pending:
            seen = {fingerprint(alert) for alert in critical_alerts}
            save_state(seen)
            baseline_pending = False
            print(
                f"Referência inicial registrada: {len(seen)} alerta(s) "
                "crítico(s) existente(s), sem reenvio."
            )
        else:
            for alert in critical_alerts:
                key = fingerprint(alert)

                if key in seen:
                    continue

                if send_alert(alert):
                    seen.add(key)
                    save_state(seen)

    except requests.RequestException as exc:
        print(f"Falha ao consultar o backend: {type(exc).__name__}")
    except (ValueError, OSError) as exc:
        print(f"Falha ao processar alertas: {type(exc).__name__}")

    time.sleep(POLL_SECONDS)
PY
