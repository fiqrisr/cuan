import { execSync } from 'node:child_process';
import path from 'node:path';

const configPath = path.resolve(import.meta.dir, '../wrangler.toml');

try {
  execSync(`wrangler d1 migrations apply cuan-test --local --config ${configPath}`, {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('Applied migrations to local test D1 database "cuan-test"');
} catch (error) {
  console.error('Failed to apply migrations to test database:', error);
  process.exit(1);
}
