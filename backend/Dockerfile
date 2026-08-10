FROM rust:latest AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo 'fn main() { println!("if you see this, the build broke"); }' > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY src ./src
COPY migrations ./migrations
COPY .env .env
RUN rm -rf /app/target/release
RUN cargo build --release
RUN ls -la /app/target/release/ | grep -E "ckaew|sentinel"

# Imagem final
FROM debian:bookworm-slim

# Instalar curl para health check + outras dependências
RUN apt-get update && \
    apt-get install -y ca-certificates libssl-dev postgresql-client curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar binário
COPY --from=builder /app/target/release/ckaew-sentinel-ai /usr/local/bin/ckaew-sentinel-ai

# Verificar se foi copiado
RUN ls -la /usr/local/bin/

COPY --from=builder /app/migrations /app/migrations
COPY --from=builder /app/.env /app/.env

RUN mkdir -p /app/uploads && chmod +x /usr/local/bin/ckaew-sentinel-ai

EXPOSE 8080

# Health check com curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Executar binário
CMD ["/usr/local/bin/ckaew-sentinel-ai"]
