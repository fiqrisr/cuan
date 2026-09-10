#!/usr/bin/env bash
# Push schema to remote Cloudflare D1 via wrangler migrations apply.
# This is idempotent: wrangler tracks applied migrations in d1_migrations
# and skips already-applied ones. Equivalent to "db-push" for D1 workflows.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

source "$ROOT/.env" 2>/dev/null || true

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_D1_TOKEN:-}"
fi

WRANGLER="$ROOT/node_modules/.bin/wrangler"

echo "Pushing schema to remote D1 database..."
"$WRANGLER" d1 migrations apply cuan --remote --config "$ROOT/wrangler.toml"
echo "db-push complete."
