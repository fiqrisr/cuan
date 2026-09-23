import { execSync } from 'node:child_process';
import path from 'node:path';
import { getRemoteDatabaseId } from './d1-http';

/**
 * Reset the REMOTE D1 database: drop every table (including d1_migrations so
 * all migrations are re-applied from scratch), then re-apply migrations via
 * wrangler. Remote database identity comes from wrangler.toml; auth comes
 * from CLOUDFLARE_API_TOKEN / CLOUDFLARE_D1_TOKEN in the environment.
 *
 * Destructive: all remote data is lost. reset-remote-db.sh guards this with an
 * interactive confirmation.
 */

const root = path.resolve(import.meta.dir, '..');
const configPath = path.join(root, 'wrangler.toml');
// Overridable so dry-runs can substitute a fake wrangler.
const wranglerBin = process.env.WRANGLER_BIN ?? path.join(root, 'node_modules/.bin/wrangler');

const LIST_TABLES_SQL =
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name";

function runSql(sql: string): { results: Record<string, unknown>[] } {
  const stdout = execSync(
    `${wranglerBin} d1 execute cuan --remote --json --yes ` +
      `--command ${JSON.stringify(sql)} --config ${JSON.stringify(configPath)}`,
    { stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
  ).toString();
  const parsed = JSON.parse(stdout) as { results: Record<string, unknown>[] }[];
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!entry) {
    throw new Error(`wrangler d1 execute returned no result for: ${sql}`);
  }
  return entry;
}

function listTables(): string[] {
  return runSql(LIST_TABLES_SQL).results.map(row => String(row.name));
}

function dropTable(table: string): void {
  const escaped = table.replace(/"/g, '""');
  runSql(`DROP TABLE IF EXISTS "${escaped}"`);
}

function wranglerError(error: unknown): string {
  const stderr = (error as { stderr?: Buffer }).stderr;
  return String(stderr ?? (error as Error)?.message ?? error).trim();
}

const databaseId = getRemoteDatabaseId();
console.log(`Resetting remote D1 database "cuan" (${databaseId})...`);

let tables = listTables(); // Also fails fast on auth/connectivity problems.
const tableCount = tables.length;
if (tableCount === 0) {
  console.log('Database is already empty.');
} else {
  // D1 enforces foreign keys, so a DROP fails while referencing tables still
  // exist. Retry passes drop child tables first regardless of dependency order.
  let lastError = '';
  while (tables.length > 0) {
    let progressed = false;
    for (const table of [...tables]) {
      try {
        dropTable(table);
        tables = tables.filter(name => name !== table);
        progressed = true;
      } catch (error) {
        lastError = wranglerError(error);
      }
    }
    if (!progressed) {
      console.error(`Could not drop remaining tables: ${tables.join(', ')}`);
      console.error(`Last error: ${lastError}`);
      process.exit(1);
    }
  }
  console.log(`Dropped ${tableCount} table(s) from remote D1 database "cuan"`);
}

console.log('Re-applying migrations to remote D1 database "cuan"...');
execSync(
  `${wranglerBin} d1 migrations apply cuan --remote --config ${JSON.stringify(configPath)}`,
  {
    stdio: 'inherit',
    env: process.env,
  },
);
console.log('Reset complete.');
