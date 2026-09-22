ARG APT_CHECK_DATE=true

FROM node:22-bookworm-slim AS dependencies
ARG APT_CHECK_DATE
WORKDIR /app
RUN if [ "$APT_CHECK_DATE" = "false" ]; then apt-get -o Acquire::Check-Date=false update; else apt-get update; fi \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
ARG APT_CHECK_DATE
WORKDIR /app
RUN if [ "$APT_CHECK_DATE" = "false" ]; then apt-get -o Acquire::Check-Date=false update; else apt-get update; fi \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner
ARG APT_CHECK_DATE
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN if [ "$APT_CHECK_DATE" = "false" ]; then apt-get -o Acquire::Check-Date=false update; else apt-get update; fi \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --uid 1001 appuser
COPY --from=builder --chown=appuser:appuser /app/.next/standalone ./
COPY --from=builder --chown=appuser:appuser /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /app/prisma ./prisma
COPY --from=builder --chown=appuser:appuser /app/scripts ./scripts
COPY --chown=appuser:appuser docker-entrypoint.sh ./docker-entrypoint.sh
USER appuser
EXPOSE 3000
CMD ["sh", "./docker-entrypoint.sh"]
