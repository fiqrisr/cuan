import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { getPlatformProxy, type PlatformProxy } from 'wrangler';
import * as schema from '../src/db/schema';
import { categories, financialAccounts, transactions, user } from '../src/db/schema';
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
  email: 'dummy@cuan.app',
  password: '12345678',
  name: 'Dummy User',
};

const seedAccounts = [
  { name: 'E-wallet', type: 'e-wallet' as const, isDefault: true, balance: '3500000' },
  { name: 'Bank', type: 'bank' as const, isDefault: false, balance: '25000000' },
];

interface TxTemplate {
  description: string;
  category: string;
  type: 'expense' | 'income';
  amountMin: number;
  amountMax: number;
  step?: number;
  preferredAccount: 'ewallet' | 'bank';
}

function getRandomAmount(min: number, max: number, step = 1000): number {
  const steps = Math.floor((max - min) / step);
  return min + Math.floor(Math.random() * (steps + 1)) * step;
}

function getOneMonthAgo(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - 1);
  if (result.getDate() !== date.getDate()) {
    result.setDate(0);
  }
  return result;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const morningTemplates: TxTemplate[] = [
  {
    description: 'Sarapan Bubur Ayam Cianjur',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 15000,
    amountMax: 20000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Kopi Kenangan Mantan Regular',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 19000,
    amountMax: 24000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Nasi Uduk Betawi Telur Balado',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 16000,
    amountMax: 22000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Lontong Sayur Padang Telur',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 15000,
    amountMax: 20000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Roti O & Kopi Susu Hangat',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 22000,
    amountMax: 30000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Sarapan Soto Ayam Lamongan',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 18000,
    amountMax: 25000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Kopi Tuku Tetangga Gula Aren',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 20000,
    amountMax: 25000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Gojek ke Stasiun KRL',
    category: 'transportation',
    type: 'expense',
    amountMin: 14000,
    amountMax: 22000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Tarif GrabBike ke Kantor',
    category: 'transportation',
    type: 'expense',
    amountMin: 18000,
    amountMax: 28000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Tiket KRL Commuter Line',
    category: 'transportation',
    type: 'expense',
    amountMin: 6000,
    amountMax: 10000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Tarif MRT Jakarta',
    category: 'transportation',
    type: 'expense',
    amountMin: 12000,
    amountMax: 18000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Isi Bensin Pertamax Motor',
    category: 'transportation',
    type: 'expense',
    amountMin: 35000,
    amountMax: 50000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
];

const middayTemplates: TxTemplate[] = [
  {
    description: 'Makan Siang Nasi Padang Rendang + Es Teh',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 28000,
    amountMax: 38000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Makan Siang Warteg Kharisma Bahari',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 18000,
    amountMax: 26000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Ayam Geprek Sambal Bawang Level 3',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 22000,
    amountMax: 28000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Mie Gacoan Level 2 + Udang Keju',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 26000,
    amountMax: 34000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Makan Siang Soto Betawi Daging',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 35000,
    amountMax: 45000,
    step: 5000,
    preferredAccount: 'bank',
  },
  {
    description: 'Bebek Goreng H. Slamet Sambal Korek',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 42000,
    amountMax: 52000,
    step: 2000,
    preferredAccount: 'bank',
  },
  {
    description: 'Makan Siang Bakso Urat & Es Jeruk',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 25000,
    amountMax: 32000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Beli Air Mineral & Snack di Alfamart',
    category: 'shopping',
    type: 'expense',
    amountMin: 15000,
    amountMax: 28000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Makan Siang Hokben Paket B',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 48000,
    amountMax: 58000,
    step: 2000,
    preferredAccount: 'bank',
  },
  {
    description: 'Patungan Makan Siang Teman Kantor',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 30000,
    amountMax: 45000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Nasi Kuning Komplit Cakalang',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 22000,
    amountMax: 30000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Es Teh Manis Jumbo Solo',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 5000,
    amountMax: 8000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
];

const afternoonTemplates: TxTemplate[] = [
  {
    description: 'Jajan Batagor & Siomay Bandung',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 15000,
    amountMax: 22000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Chatime Hazelnut Chocolate Milk Tea',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 28000,
    amountMax: 36000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Cemilan Gorengan & Tahu Bakso',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 12000,
    amountMax: 18000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Gojek Pulang Kantor ke Rumah',
    category: 'transportation',
    type: 'expense',
    amountMin: 22000,
    amountMax: 34000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'GrabCar Pulang Hujan Deras',
    category: 'transportation',
    type: 'expense',
    amountMin: 45000,
    amountMax: 65000,
    step: 5000,
    preferredAccount: 'bank',
  },
  {
    description: 'Biaya Parkir Motor & Penitipan Helm',
    category: 'transportation',
    type: 'expense',
    amountMin: 5000,
    amountMax: 10000,
    step: 1000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Beli Vitamin C & Tolak Angin Guardian',
    category: 'health',
    type: 'expense',
    amountMin: 35000,
    amountMax: 55000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Beli Obat Sakit Kepala di Apotek',
    category: 'health',
    type: 'expense',
    amountMin: 20000,
    amountMax: 35000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Laundry Kiloan Cuci Komplit',
    category: 'misc',
    type: 'expense',
    amountMin: 28000,
    amountMax: 42000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Potong Rambut di Barbershop',
    category: 'misc',
    type: 'expense',
    amountMin: 45000,
    amountMax: 60000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Isi Saldo Kartu Tol E-Money',
    category: 'transportation',
    type: 'expense',
    amountMin: 50000,
    amountMax: 100000,
    step: 50000,
    preferredAccount: 'bank',
  },
  {
    description: 'Beli Roti Bakar Bandung Sore',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 18000,
    amountMax: 26000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
];

const eveningTemplates: TxTemplate[] = [
  {
    description: 'Makan Malam Nasi Goreng Gila Spesial',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 24000,
    amountMax: 32000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Sate Ayam Madura 10 Tusuk + Lontong',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 28000,
    amountMax: 36000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Martabak Manis Bangka Coklat Keju',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 50000,
    amountMax: 70000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Pecel Lele & Sambal Terasi Lamongan',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 22000,
    amountMax: 28000,
    step: 2000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Makan Malam Ramen Seirock-Ya',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 78000,
    amountMax: 98000,
    step: 5000,
    preferredAccount: 'bank',
  },
  {
    description: 'Makan Seafood Kepiting Saus Padang',
    category: 'food-beverage',
    type: 'expense',
    amountMin: 85000,
    amountMax: 135000,
    step: 10000,
    preferredAccount: 'bank',
  },
  {
    description: 'Belanja Kebutuhan Harian di Indomaret',
    category: 'shopping',
    type: 'expense',
    amountMin: 45000,
    amountMax: 85000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Beli Sabun Mandi, Shampo & Sikat Gigi',
    category: 'shopping',
    type: 'expense',
    amountMin: 48000,
    amountMax: 75000,
    step: 3000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Tiket Bioskop XXI Nonton Film',
    category: 'entertainment',
    type: 'expense',
    amountMin: 50000,
    amountMax: 85000,
    step: 5000,
    preferredAccount: 'bank',
  },
  {
    description: 'Checkout Tokopedia Kebutuhan Rumah',
    category: 'shopping',
    type: 'expense',
    amountMin: 75000,
    amountMax: 185000,
    step: 10000,
    preferredAccount: 'bank',
  },
  {
    description: 'Checkout Shopee Kaos Polos Katun',
    category: 'shopping',
    type: 'expense',
    amountMin: 85000,
    amountMax: 145000,
    step: 10000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Beli Buku Pemrograman di Gramedia',
    category: 'education',
    type: 'expense',
    amountMin: 95000,
    amountMax: 145000,
    step: 10000,
    preferredAccount: 'bank',
  },
];

const nightTemplates: TxTemplate[] = [
  {
    description: 'Token Listrik PLN Rumah',
    category: 'utilities',
    type: 'expense',
    amountMin: 100000,
    amountMax: 200000,
    step: 50000,
    preferredAccount: 'bank',
  },
  {
    description: 'Tagihan Internet WiFi Indihome',
    category: 'utilities',
    type: 'expense',
    amountMin: 385000,
    amountMax: 420000,
    step: 15000,
    preferredAccount: 'bank',
  },
  {
    description: 'Tagihan Air Bersih PDAM',
    category: 'utilities',
    type: 'expense',
    amountMin: 65000,
    amountMax: 95000,
    step: 5000,
    preferredAccount: 'bank',
  },
  {
    description: 'Paket Data Internet Telkomsel 50GB',
    category: 'utilities',
    type: 'expense',
    amountMin: 95000,
    amountMax: 125000,
    step: 10000,
    preferredAccount: 'bank',
  },
  {
    description: 'Langganan Netflix Premium Bulanan',
    category: 'entertainment',
    type: 'expense',
    amountMin: 186000,
    amountMax: 186000,
    step: 1000,
    preferredAccount: 'bank',
  },
  {
    description: 'Langganan Spotify Premium Bulanan',
    category: 'entertainment',
    type: 'expense',
    amountMin: 54990,
    amountMax: 54990,
    step: 10,
    preferredAccount: 'bank',
  },
  {
    description: 'Investasi Reksadana Bibit Bulanan',
    category: 'investment',
    type: 'expense',
    amountMin: 500000,
    amountMax: 1000000,
    step: 250000,
    preferredAccount: 'bank',
  },
  {
    description: 'Beli E-Book Pemrograman Online',
    category: 'education',
    type: 'expense',
    amountMin: 110000,
    amountMax: 160000,
    step: 10000,
    preferredAccount: 'bank',
  },
  {
    description: 'Iuran Kebersihan & Keamanan RT',
    category: 'housing',
    type: 'expense',
    amountMin: 50000,
    amountMax: 75000,
    step: 5000,
    preferredAccount: 'bank',
  },
  {
    description: 'Sedekah / Donasi Rumah Yatim',
    category: 'misc',
    type: 'expense',
    amountMin: 25000,
    amountMax: 50000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
  {
    description: 'Beli Tiket Kereta Liburan Weekend',
    category: 'travel',
    type: 'expense',
    amountMin: 150000,
    amountMax: 260000,
    step: 10000,
    preferredAccount: 'bank',
  },
  {
    description: 'Service & Cuci AC Rumah',
    category: 'housing',
    type: 'expense',
    amountMin: 80000,
    amountMax: 120000,
    step: 10000,
    preferredAccount: 'bank',
  },
];

const specialTemplates: Record<number, TxTemplate> = {
  25: {
    description: 'Gaji Bulanan PT Teknologi Cuan',
    category: 'salary',
    type: 'income',
    amountMin: 12500000,
    amountMax: 12500000,
    preferredAccount: 'bank',
  },
  10: {
    description: 'Pembayaran Proyek Freelance Web Design',
    category: 'bonus',
    type: 'income',
    amountMin: 2500000,
    amountMax: 3500000,
    step: 500000,
    preferredAccount: 'bank',
  },
  5: {
    description: 'Tagihan Internet WiFi Indihome',
    category: 'utilities',
    type: 'expense',
    amountMin: 385000,
    amountMax: 385000,
    preferredAccount: 'bank',
  },
  15: {
    description: 'Token Listrik PLN Rumah',
    category: 'utilities',
    type: 'expense',
    amountMin: 200000,
    amountMax: 200000,
    preferredAccount: 'bank',
  },
  20: {
    description: 'Langganan Netflix Premium Bulanan',
    category: 'entertainment',
    type: 'expense',
    amountMin: 186000,
    amountMax: 186000,
    preferredAccount: 'bank',
  },
  1: {
    description: 'Belanja Bulanan Supermarket Superindo',
    category: 'shopping',
    type: 'expense',
    amountMin: 550000,
    amountMax: 750000,
    step: 50000,
    preferredAccount: 'bank',
  },
  12: {
    description: 'Investasi Reksadana Bibit Bulanan',
    category: 'investment',
    type: 'expense',
    amountMin: 500000,
    amountMax: 1000000,
    step: 250000,
    preferredAccount: 'bank',
  },
  7: {
    description: 'Cashback Promo QRIS Merchant',
    category: 'bonus',
    type: 'income',
    amountMin: 35000,
    amountMax: 65000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
  18: {
    description: 'Transfer dari Teman (Patungan Makan)',
    category: 'transfer',
    type: 'income',
    amountMin: 45000,
    amountMax: 85000,
    step: 5000,
    preferredAccount: 'ewallet',
  },
  8: {
    description: 'Top Up Saldo E-wallet dari Rekening Bank',
    category: 'transfer',
    type: 'income',
    amountMin: 1000000,
    amountMax: 1000000,
    preferredAccount: 'ewallet',
  },
  22: {
    description: 'Top Up Saldo E-wallet dari Rekening Bank',
    category: 'transfer',
    type: 'income',
    amountMin: 1000000,
    amountMax: 1000000,
    preferredAccount: 'ewallet',
  },
};
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
    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      if (existingUser.name !== seedUser.name) {
        await db.update(user).set({ name: seedUser.name }).where(eq(user.id, userId));
      }
    } else {
      const res = await auth.api.signUpEmail({
        body: { email: seedUser.email, password: seedUser.password, name: seedUser.name },
      });
      userId = res.user.id;
    }

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

    console.log(`User and accounts ready for ${seedUser.email}.`);

    // Fetch accounts to get their generated IDs
    const userAccounts = await db.query.financialAccounts.findMany({
      where: eq(financialAccounts.userId, userId),
    });
    const ewalletAccount = userAccounts.find(a => a.name === 'E-wallet') ?? userAccounts[0];
    const bankAccount =
      userAccounts.find(a => a.name === 'Bank') ?? userAccounts[1] ?? userAccounts[0];

    // Build category map
    const allCategories = await db.query.categories.findMany();
    const categoryMap = new Map(allCategories.map(c => [c.name, c.id]));
    const defaultCategoryId = allCategories[0]?.id ?? 1;

    // Clear existing transactions for this user so re-seeding produces a fresh 1-month window
    await db.delete(transactions).where(eq(transactions.userId, userId));

    console.log('Generating 1 month of transactions (3-5 transactions per day in IDR)...');

    const now = new Date();
    const startDate = getOneMonthAgo(now);

    const days: Date[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    while (cursor <= todayMidnight) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const slotHours = [
      { hourMin: 7, hourMax: 9 }, // Slot 0: Morning
      { hourMin: 11, hourMax: 13 }, // Slot 1: Midday
      { hourMin: 14, hourMax: 16 }, // Slot 2: Afternoon
      { hourMin: 18, hourMax: 20 }, // Slot 3: Evening
      { hourMin: 21, hourMax: 22 }, // Slot 4: Night
    ];

    const INITIAL_EWALLET_BALANCE = 3500000;
    const INITIAL_BANK_BALANCE = 25000000;
    let ewalletRunningBalance = INITIAL_EWALLET_BALANCE;
    let bankRunningBalance = INITIAL_BANK_BALANCE;

    const allTransactions: (typeof transactions.$inferInsert)[] = [];

    for (const day of days) {
      const isToday = day.toDateString() === now.toDateString();
      const count = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5 transactions
      const dayTemplates: TxTemplate[] = [];

      // Check if day has a special recurring event
      const special = specialTemplates[day.getDate()];
      if (special) {
        dayTemplates.push(special);
      }

      // Fill remaining slots
      const slotPools = [
        morningTemplates,
        middayTemplates,
        afternoonTemplates,
        eveningTemplates,
        nightTemplates,
      ];

      let poolIdx = 0;
      while (dayTemplates.length < count) {
        const pool = slotPools[poolIdx % slotPools.length];
        const candidate = pickRandom(pool);
        if (!dayTemplates.some(t => t.description === candidate.description)) {
          dayTemplates.push(candidate);
        } else {
          // If duplicate description in same day, take a different random item
          const alt = pool.find(
            item => !dayTemplates.some(t => t.description === item.description),
          );
          dayTemplates.push(alt ?? candidate);
        }
        poolIdx++;
      }

      // Generate timestamps for transactions on this day
      const dayTxs: (typeof transactions.$inferInsert)[] = [];

      for (let s = 0; s < count; s++) {
        const template = dayTemplates[s];
        const slot = slotHours[Math.min(s, slotHours.length - 1)];
        const hour = slot.hourMin + Math.floor(Math.random() * (slot.hourMax - slot.hourMin + 1));
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);

        let txTime = new Date(day);
        txTime.setHours(hour, minute, second, 0);

        if (isToday && txTime.getTime() > now.getTime()) {
          const startOfTodayMs = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          ).getTime();
          const maxMs = now.getTime() - 1000;
          if (maxMs > startOfTodayMs) {
            const spread = (maxMs - startOfTodayMs) / count;
            txTime = new Date(startOfTodayMs + Math.floor(spread * s + Math.random() * spread));
          } else {
            txTime = new Date(now.getTime() - (count - s) * 1000);
          }
        }

        const amount = getRandomAmount(
          template.amountMin,
          template.amountMax,
          template.step ?? 1000,
        );
        const categoryId = categoryMap.get(template.category) ?? defaultCategoryId;
        const account = template.preferredAccount === 'bank' ? bankAccount : ewalletAccount;

        if (template.preferredAccount === 'bank') {
          bankRunningBalance += template.type === 'expense' ? -amount : amount;
        } else {
          ewalletRunningBalance += template.type === 'expense' ? -amount : amount;
        }

        dayTxs.push({
          id: crypto.randomUUID(),
          userId,
          accountId: account.id,
          type: template.type,
          amount: amount.toString(),
          currency: 'IDR',
          categoryId,
          description: template.description,
          date: txTime,
          createdAt: txTime,
          updatedAt: txTime,
        });
      }

      // Sort transactions for this day chronologically
      dayTxs.sort((a, b) => {
        const timeA = a.date instanceof Date ? a.date.getTime() : Number(a.date);
        const timeB = b.date instanceof Date ? b.date.getTime() : Number(b.date);
        return timeA - timeB;
      });

      allTransactions.push(...dayTxs);
    }

    // Insert transactions in chunks to avoid parameter limits in D1
    const CHUNK_SIZE = 5;
    for (let i = 0; i < allTransactions.length; i += CHUNK_SIZE) {
      const chunk = allTransactions.slice(i, i + CHUNK_SIZE);
      await db.insert(transactions).values(chunk);
    }

    // Update accounts with final running balance
    await db
      .update(financialAccounts)
      .set({ balance: ewalletRunningBalance.toString() })
      .where(eq(financialAccounts.id, ewalletAccount.id));

    await db
      .update(financialAccounts)
      .set({ balance: bankRunningBalance.toString() })
      .where(eq(financialAccounts.id, bankAccount.id));

    console.log(
      `Seeded ${allTransactions.length} transactions across ${days.length} days for ${seedUser.email}.`,
    );
    console.log(
      `Final balances: E-wallet = Rp ${ewalletRunningBalance.toLocaleString('id-ID')}, Bank = Rp ${bankRunningBalance.toLocaleString('id-ID')}`,
    );
  } finally {
    await proxy?.dispose();
  }
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
