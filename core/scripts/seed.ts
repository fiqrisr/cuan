import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { getPlatformProxy, type PlatformProxy } from 'wrangler';
import * as schema from '../src/db/schema';
import { categories, financialAccounts, user } from '../src/db/schema';
import { createRemoteD1Database, getRemoteDatabaseId } from './d1-http';

const data = [
  { name: 'food-beverage', label: 'Makanan & Minuman' },
  { name: 'transportation', label: 'Transportasi' },
  { name: 'housing', label: 'Tempat Tinggal' },
  { name: 'utilities', label: 'Tagihan & Utilitas' },
  { name: 'entertainment', label: 'Hiburan' },
  { name: 'shopping', label: 'Belanja' },
  { name: 'health', label: 'Kesehatan' },
  { name: 'education', label: 'Pendidikan' },
  { name: 'travel', label: 'Liburan' },
  { name: 'investment', label: 'Investasi' },
  { name: 'salary', label: 'Gaji' },
  { name: 'bonus', label: 'Bonus' },
  { name: 'transfer', label: 'Transfer' },
  { name: 'misc', label: 'Lainnya' },
];

const seedUser = {
  email: 'fiqri@cuan.app',
  password: '12345678',
  name: 'Fiqri',
};

const seedAccounts = [
  { name: 'E-wallet', type: 'e-wallet' as const, isDefault: true, balance: '650000' },
  { name: 'Bank', type: 'bank' as const, isDefault: false, balance: '5400000' },
];
// Run with `--remote` to seed the remote D1 database over the Cloudflare REST
// API (credentials required in .env) instead of the local wrangler proxy.
const remote = process.argv.includes('--remote');

async function seed() {
  console.log('Seeding categories...');
  let proxy: PlatformProxy<{ CLOUDFLARE_D1_BINDING_NAME: D1Database }> | undefined;

  try {
    let d1: D1Database | undefined;
    const globalScope: Record<string, unknown> = globalThis;
    const globalBinding = globalScope.CLOUDFLARE_D1_BINDING_NAME;
    if (globalBinding && typeof globalBinding === 'object' && 'prepare' in globalBinding) {
      d1 = globalBinding as D1Database;
    }
    if (!d1) {
      if (remote) {
        d1 = createRemoteD1Database();
        console.log(`Seeding REMOTE D1 database "cuan" (${getRemoteDatabaseId()})...`);
      } else {
        const configPath = path.resolve(import.meta.dir, '../wrangler.toml');
        proxy = await getPlatformProxy<{ CLOUDFLARE_D1_BINDING_NAME: D1Database }>({
          configPath,
        });
        d1 = proxy.env.CLOUDFLARE_D1_BINDING_NAME;
      }
    }

    if (!d1) {
      throw new Error('Cloudflare D1 binding "CLOUDFLARE_D1_BINDING_NAME" not found');
    }

    const db = drizzle(d1, { schema });

    await db.insert(categories).values(data).onConflictDoNothing();
    console.log('Done seeding categories.');

    console.log('Seeding user and accounts...');
    // Expose the binding so the app's db singleton (used by auth) reuses this proxy.
    globalScope.CLOUDFLARE_D1_BINDING_NAME = d1;
    const { auth } = await import('../src/modules/auth');

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, seedUser.email),
    });
    const userId = existingUser
      ? existingUser.id
      : (
          await auth.api.signUpEmail({
            body: { email: seedUser.email, password: seedUser.password, name: seedUser.name },
          })
        ).user.id;

    await db
      .insert(financialAccounts)
      .values(seedAccounts.map(account => ({ ...account, userId })))
      .onConflictDoNothing();

    // Enforce E-wallet as the single default account for the seeded user.
    await db
      .update(financialAccounts)
      .set({ isDefault: false })
      .where(eq(financialAccounts.userId, userId));
    await db
      .update(financialAccounts)
      .set({ isDefault: true })
      .where(and(eq(financialAccounts.userId, userId), eq(financialAccounts.name, 'E-wallet')));

    console.log(`Done seeding user and accounts for ${seedUser.email}.`);
  } finally {
    await proxy?.dispose();
  }
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
