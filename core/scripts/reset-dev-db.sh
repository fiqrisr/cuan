#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/cuan"
export BETTER_AUTH_SECRET="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
export OPENMODEL_API_KEY="dummy"
export OPENMODEL_BASE_URL="https://api.openmodel.ai"
export OPENMODEL_MODEL="dummy"
export NODE_ENV="development"

echo "Resetting dev database..."
bun run scripts/reset-dev-db.ts

echo "Running migrations..."
bunx drizzle-kit migrate

echo "Seeding default categories..."
bun run scripts/seed.ts
