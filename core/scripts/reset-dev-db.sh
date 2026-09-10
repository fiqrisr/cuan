#!/usr/bin/env bash
set -euo pipefail

export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-dummy}"
export CLOUDFLARE_DATABASE_ID="${CLOUDFLARE_DATABASE_ID:-dummy}"
export CLOUDFLARE_D1_TOKEN="${CLOUDFLARE_D1_TOKEN:-dummy}"
export BETTER_AUTH_SECRET="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
export OPENMODEL_API_KEY="dummy"
export OPENMODEL_BASE_URL="https://api.openmodel.ai"
export OPENMODEL_MODEL="dummy"
export NODE_ENV="development"

echo "Resetting dev database..."
bun run scripts/reset-dev-db.ts

echo "Seeding default categories..."
bun run scripts/seed.ts
