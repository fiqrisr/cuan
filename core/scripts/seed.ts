import { categories } from '../src/db/schema';
import { db } from '../src/db';

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

async function seed() {
  console.log('Seeding categories...');
  for (const item of data) {
    const existing = await db.query.categories.findFirst({
      where: (c, { eq, and, isNull }) => and(eq(c.name, item.name), isNull(c.userId)),
    });
    if (!existing) {
      await db.insert(categories).values(item);
    }
  }
  console.log('Done seeding categories.');
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
