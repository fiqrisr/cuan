import { rmSync } from 'node:fs';
import path from 'node:path';

// Wrangler stores local D1 databases under .wrangler/state/v3/d1/<database-name>/
const dbPath = path.resolve(import.meta.dir, '../.wrangler/state/v3/d1/cuan-test');

try {
  rmSync(dbPath, { recursive: true, force: true });
  console.log('Dropped local test D1 database "cuan-test"');
} catch (error) {
  console.error('Failed to drop test database:', error);
  process.exit(1);
}
