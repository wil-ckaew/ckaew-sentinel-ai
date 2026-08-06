#!/bin/bash

echo "🛑 Parando CKAEW Sentinel AI..."

# Parar backend Rust
pkill -f ckaew-sentinel-ai 2>/dev/null || true

# Parar containers
docker compose down

echo "✅ Sistema parado!"
