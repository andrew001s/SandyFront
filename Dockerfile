# ==============================================================================
# Dockerfile para SandyFront (Next.js 15) en DigitalOcean
# Multi-stage build con Bun y salida standalone para mínimo consumo de RAM
# ==============================================================================
FROM oven/bun:1-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Dependencias
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# 2. Compilación (Builder)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN bun run build

# 3. Imagen final de producción (Runner)
FROM base AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copiar archivos públicos y el servidor standalone generado por Next.js
COPY --from=builder --chown=bun:bun /app/public ./public
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

# Usuario sin privilegios por seguridad (el usuario 'bun' ya viene incluido en oven/bun)
USER bun

EXPOSE 3000

CMD ["bun", "server.js"]
