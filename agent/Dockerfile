FROM rust:latest AS builder

WORKDIR /app

# Copiar arquivos de dependência primeiro
COPY Cargo.toml Cargo.lock* ./

# Criar src dummy para build de dependências
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copiar código fonte real
COPY src ./src

# Construir release final
RUN cargo build --release

# Imagem final
FROM debian:bookworm-slim

# Instalar dependências de sistema
RUN apt-get update && \
    apt-get install -y ca-certificates tzdata procps && \
    rm -rf /var/lib/apt/lists/*

# Copiar binário
COPY --from=builder /app/target/release/ckaew-agent /usr/local/bin/

# Criar diretório para logs
RUN mkdir -p /var/log/ckaew /etc/ckaew-agent

# Comando de entrada
CMD ["/usr/local/bin/ckaew-agent"]
