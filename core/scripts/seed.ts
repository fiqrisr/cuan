import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { getPlatformProxy, type PlatformProxy } from 'wrangler';
import * as schema from '../src/db/schema';
import { categories, financialAccounts, user } from '../src/db/schema';

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
  { name: 'E-wallet', type: 'e-wallet' as const, isDefault: true },
  { name: 'Bank', type: 'bank' as const, isDefault: false },
];

async function seed() {
  console.log('Seeding categories...');
  let proxy:
    | PlatformProxy<{ CLOUDFLARE_D1_BINDING_NAME: typeof CLOUDFLARE_D1_BINDING_NAME }>
    | undefined;

  try {
    let d1: typeof CLOUDFLARE_D1_BINDING_NAME | undefined;
    const globalScope: Record<string, unknown> = globalThis;
    const globalBinding = globalScope.CLOUDFLARE_D1_BINDING_NAME;
    if (globalBinding && typeof globalBinding === 'object' && 'prepare' in globalBinding) {
      d1 = globalBinding as typeof CLOUDFLARE_D1_BINDING_NAME;
    }
    if (!d1) {
      const configPath = path.resolve(import.meta.dir, '../wrangler.toml');
      proxy = await getPlatformProxy<{
        CLOUDFLARE_D1_BINDING_NAME: typeof CLOUDFLARE_D1_BINDING_NAME;
      }>({
        configPath,
      });
      d1 = proxy.env.CLOUDFLARE_D1_BINDING_NAME;
    }

    if (!d1) {
      throw new Error('Cloudflare D1 binding "CLOUDFLARE_D1_BINDING_NAME" not found');
    }

    const db = drizzle(d1, { schema });

    await db.insert(categories).values(data).onConflictDoNothing();
    console.log('Done seeding categories.');
  } finally {
    await proxy?.dispose();
  }
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
