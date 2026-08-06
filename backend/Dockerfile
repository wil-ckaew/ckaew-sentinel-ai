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

RUN apt-get update && \
    apt-get install -y ca-certificates libssl-dev postgresql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar binário - verificar o nome real
COPY --from=builder /app/target/release/ckaew-sentinel-ai /usr/local/bin/ckaew-sentinel-ai

# Verificar se foi copiado
RUN ls -la /usr/local/bin/

COPY --from=builder /app/migrations /app/migrations
COPY --from=builder /app/.env /app/.env

RUN mkdir -p /app/uploads && chmod +x /usr/local/bin/ckaew-sentinel-ai

EXPOSE 8080

# Executar binário diretamente como processo principal
CMD ["/usr/local/bin/ckaew-sentinel-ai"]
