#!/bin/sh
# Entrypoint for the CyberAudit Pro API container.
#
# 1. Pushes the Drizzle schema to Postgres (safe to run every start —
#    it's a no-op if the schema already matches).
# 2. Starts the built API server.
set -e

echo "[entrypoint] Applying database schema..."

attempt=0
max_attempts=15
until pnpm --filter @workspace/db run push-force; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "[entrypoint] Database did not become ready in time, giving up."
    exit 1
  fi
  echo "[entrypoint] Database not ready yet (attempt $attempt/$max_attempts), retrying in 2s..."
  sleep 2
done

echo "[entrypoint] Schema applied. Starting API server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
