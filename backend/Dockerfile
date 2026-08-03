FROM rust:latest AS builder

WORKDIR /app

# Copiar Cargo.toml primeiro
COPY Cargo.toml ./

# Criar src dummy para cache de dependências
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copiar código fonte real
COPY src ./src

# Construir release final
RUN cargo build --release

# Imagem final - usar a mesma versão do sistema
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copiar o binário
COPY --from=builder /app/target/release/ckaew-sentinel-ai /usr/local/bin/

# Configurar variáveis de ambiente
ENV RUST_BACKTRACE=1
ENV RUST_LOG=info

EXPOSE 8080

# Executar o binário
CMD ["/usr/local/bin/ckaew-sentinel-ai"]
