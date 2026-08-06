<<<<<<< HEAD
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
=======
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
>>>>>>> 61a6549ee9cfbf7e7cec9a1308aafc1cd6828fce
