#!/usr/bin/env bash
# Reset and seed the REMOTE D1 database (the one the deployed Worker uses):
#   1. Drop every table, including d1_migrations
#   2. Re-apply all migrations (wrangler captures a backup first)
#   3. Seed default categories, the dev user, and accounts
#
# Destructive and irreversible: all remote data is lost.
# Real credentials are required in core/.env (CLOUDFLARE_ACCOUNT_ID,
# CLOUDFLARE_D1_TOKEN or CLOUDFLARE_API_TOKEN, BETTER_AUTH_SECRET).
# Set FORCE=yes to skip the confirmation prompt.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

set -a
source "$ROOT/.env" 2>/dev/null || true
set +a

for var in CLOUDFLARE_ACCOUNT_ID BETTER_AUTH_SECRET; do
  value="${!var:-}"
  if [[ -z "$value" || "$value" == "dummy" ]]; then
    echo "error: $var must be set to a real value in core/.env to touch the remote D1 database." >&2
    exit 1
  fi
done

token="${CLOUDFLARE_D1_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}"
if [[ -z "$token" || "$token" == "dummy" ]]; then
  echo "error: CLOUDFLARE_D1_TOKEN (or CLOUDFLARE_API_TOKEN) must be set to a real value in core/.env" >&2
  echo "       to touch the remote D1 database." >&2
  exit 1
fi

# wrangler authenticates via CLOUDFLARE_API_TOKEN.
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-$CLOUDFLARE_D1_TOKEN}"

if [[ "${FORCE:-}" != "yes" ]]; then
  echo "WARNING: this drops ALL data in the remote D1 database \"cuan\" and re-seeds it."
  read -r -p "Type RESET to continue: " confirm
  if [[ "$confirm" != "RESET" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

echo "Resetting remote D1 database..."
bun run scripts/reset-remote-db.ts

echo "Seeding remote database..."
bun run scripts/seed.ts --remote
echo "Remote database reset and seeded."
