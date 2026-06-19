# stage 1: build
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# stage 2: production
FROM node:24-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/assets ./assets
COPY scripts/start-prod.sh ./scripts/start-prod.sh
COPY package.json ./
ENV NODE_ENV=production TZ=Europe/Kyiv
RUN chmod +x /app/scripts/start-prod.sh
RUN mkdir -p /app/data
VOLUME ["/app/data"]
ENV DATABASE_URL="file:/app/data/angelplanner.db"
EXPOSE 6666
CMD ["sh", "/app/scripts/start-prod.sh"]
