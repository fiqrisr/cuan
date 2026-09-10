#!/usr/bin/env bash
# Apply D1 migrations to the remote Cloudflare D1 database via wrangler.
# Uses wrangler d1 migrations apply --remote, which tracks applied migrations
# in the d1_migrations table and is idempotent.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

source "$ROOT/.env" 2>/dev/null || true

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_D1_TOKEN:-}"
fi

WRANGLER="$ROOT/node_modules/.bin/wrangler"

echo "Applying migrations to remote D1 database..."
"$WRANGLER" d1 migrations apply cuan --remote --config "$ROOT/wrangler.toml"
echo "db-migrate complete."
