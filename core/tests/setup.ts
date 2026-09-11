import { afterAll } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { PlatformProxy } from 'wrangler';
import { getPlatformProxy } from 'wrangler';

/**
 * Bun test preload: provisions a fresh, in-process D1 database (via wrangler's
 * getPlatformProxy with ephemeral storage), applies Drizzle migrations, and
 * exposes the binding on globalThis so `src/env.ts` can pick it up.
 *
 * Set up here because `src/db` instantiates the Drizzle D1 driver from the
 * `CLOUDFLARE_D1_BINDING_NAME` env binding at import time, before any test
 * module runs.
 */

type Binding = { CLOUDFLARE_D1_BINDING_NAME: D1Database };

const scope = globalThis as {
  CLOUDFLARE_D1_BINDING_NAME?: D1Database;
  __d1TestProxy?: PlatformProxy<Binding>;
};

const proxy = await getPlatformProxy<Binding>({
  configPath: path.resolve(import.meta.dir, '../wrangler.toml'),
  // Ephemeral storage: every `bun test` run starts from an empty database.
  persist: false,
});

scope.CLOUDFLARE_D1_BINDING_NAME = proxy.env.CLOUDFLARE_D1_BINDING_NAME;
scope.__d1TestProxy = proxy;

const db = drizzle(proxy.env.CLOUDFLARE_D1_BINDING_NAME);

const journalPath = path.resolve(import.meta.dir, '../drizzle/meta/_journal.json');
const journal = JSON.parse(readFileSync(journalPath, 'utf-8')) as {
  entries: { tag: string }[];
};

for (const entry of journal.entries) {
  const file = path.resolve(import.meta.dir, `../drizzle/${entry.tag}.sql`);
  const contents = readFileSync(file, 'utf-8');
  for (const statement of contents.split('--> statement-breakpoint')) {
    if (statement.trim().length > 0) {
      await db.run(sql.raw(statement));
    }
  }
}
console.log(`Applied ${journal.entries.length} migration(s) to test D1 database.`);

afterAll(async () => {
  await proxy.dispose();
  scope.CLOUDFLARE_D1_BINDING_NAME = undefined;
  scope.__d1TestProxy = undefined;
});
