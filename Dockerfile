# ============================================
# CKAEW SENTINEL AI - DOCKERFILE COMPLETO
# ============================================

# ============================================
# 1. BACKEND RUST
# ============================================
FROM rust:latest AS backend-builder

WORKDIR /app

# Copiar Cargo.toml e Cargo.lock
COPY backend/Cargo.toml backend/Cargo.lock* ./

# Criar src dummy para cache
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copiar código fonte real
COPY backend/src ./src
COPY backend/migrations ./migrations
COPY backend/.env .env

# Build final
RUN cargo build --release

# ============================================
# 2. FRONTEND NEXT.JS
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copiar arquivos de dependência
COPY web-dashboard/package*.json ./
COPY web-dashboard/tailwind.config.js ./
COPY web-dashboard/postcss.config.js ./

RUN npm install

# Copiar código fonte
COPY web-dashboard ./

# Build
RUN npm run build

# ============================================
# 3. IMAGEM FINAL
# ============================================
FROM debian:bookworm-slim

# Instalar dependências do sistema
RUN apt-get update && \
    apt-get install -y \
        ca-certificates \
        curl \
        python3 \
        python3-pip \
        python3-venv \
        postgresql-client \
        && \
    rm -rf /var/lib/apt/lists/*

# Criar diretórios
WORKDIR /app
RUN mkdir -p /app/backend/uploads /app/backend/logs /app/scripts /app/backups

# ============================================
# 4. COPIAR BACKEND
# ============================================
COPY --from=backend-builder /app/target/release/ckaew-sentinel-ai /usr/local/bin/
COPY --from=backend-builder /app/migrations /app/migrations
COPY --from=backend-builder /app/.env /app/.env

# ============================================
# 5. COPIAR FRONTEND
# ============================================
COPY --from=frontend-builder /app/.next/standalone /app/web-dashboard
COPY --from=frontend-builder /app/.next/static /app/web-dashboard/.next/static
COPY --from=frontend-builder /app/public /app/web-dashboard/public

# ============================================
# 6. COPIAR SCRIPTS E BOT
# ============================================
COPY scripts/requirements.txt /app/scripts/
COPY scripts/telegram_bot_completo.py /app/scripts/
COPY scripts/start_bot.sh /app/scripts/
COPY scripts/backup.sh /app/scripts/
COPY scripts/send_report.sh /app/scripts/

# Instalar dependências Python
RUN python3 -m pip install --no-cache-dir -r /app/scripts/requirements.txt

# Dar permissão
RUN chmod +x /app/scripts/*.sh && \
    chmod +x /usr/local/bin/ckaew-sentinel-ai

# ============================================
# 7. EXPOR PORTAS
# ============================================
EXPOSE 8080 3000

# ============================================
# 8. HEALTH CHECK
# ============================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# ============================================
# 9. ENTRYPOINT
# ============================================
# Iniciar backend e frontend
CMD ["/usr/local/bin/ckaew-sentinel-ai"]
