#!/usr/bin/env bash
set -euo pipefail

export PORT="${PORT:-3000}"
export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://localhost:3000}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-dummy}"
export CLOUDFLARE_DATABASE_ID="${CLOUDFLARE_DATABASE_ID:-dummy}"
export CLOUDFLARE_D1_TOKEN="${CLOUDFLARE_D1_TOKEN:-dummy}"
export OPENMODEL_API_KEY="${OPENMODEL_API_KEY:-dummy}"
export OPENMODEL_BASE_URL="${OPENMODEL_BASE_URL:-http://localhost:3999}"
export OPENMODEL_MODEL="${OPENMODEL_MODEL:-dummy}"
export NODE_ENV="${NODE_ENV:-test}"

echo "Creating test database and applying migrations..."
bun run scripts/create-test-db.ts

echo "Running tests..."
bun test

echo "Dropping test database..."
bun run scripts/drop-test-db.ts
