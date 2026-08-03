FROM rust:latest AS builder

WORKDIR /app

COPY backend/Cargo.toml backend/Cargo.lock ./

RUN mkdir src && echo "fn main() {}" > src/main.rs

RUN cargo build --release

COPY backend/src ./src

RUN cargo build --release


FROM debian:bookworm-slim

WORKDIR /app

COPY --from=builder /app/target/release/ckaew-sentinel-ai .

EXPOSE 8080

CMD ["./ckaew-sentinel-ai"]
