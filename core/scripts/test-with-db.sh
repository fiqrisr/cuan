#!/usr/bin/env bash
set -euo pipefail

export PORT="${PORT:-3000}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/cuan-test}"
export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://localhost:3000}"
export OPENMODEL_API_KEY="${OPENMODEL_API_KEY:-dummy}"
export OPENMODEL_BASE_URL="${OPENMODEL_BASE_URL:-http://localhost:3999/v1}"
export OPENMODEL_MODEL="${OPENMODEL_MODEL:-dummy}"
export NODE_ENV="${NODE_ENV:-test}"

echo "Creating test database..."
bun run scripts/create-test-db.ts

echo "Running migrations..."
bunx drizzle-kit migrate

echo "Running tests..."
bun test

echo "Dropping test database..."
bun run scripts/drop-test-db.ts
