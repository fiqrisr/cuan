import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const configPath = path.resolve(import.meta.dir, '../wrangler.toml');

// Wrangler stores local D1 databases under .wrangler/state/v3/d1/<database-name>/
const dbPath = path.resolve(import.meta.dir, '../.wrangler/state/v3/d1/cuan');

try {
  // Drop local D1 state to fully reset
  rmSync(dbPath, { recursive: true, force: true });
  console.log('Dropped local D1 database "cuan"');

  // Re-apply all migrations from scratch
  execSync(`wrangler d1 migrations apply cuan --local --config ${configPath}`, {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('Re-applied migrations to local D1 database "cuan"');
} catch (error) {
  console.error('Failed to reset dev database:', error);
  process.exit(1);
}
