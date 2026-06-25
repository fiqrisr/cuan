import { categories } from '../src/db/schema';
import { db } from '../src/lib/db';

const data = [
  { name: 'groceries', label: 'Groceries' },
  { name: 'dining-out', label: 'Dining Out' },
  { name: 'coffee', label: 'Coffee' },
  { name: 'snacks', label: 'Snacks' },
  { name: 'public-transit', label: 'Public Transit' },
  { name: 'ride-hailing', label: 'Ride Hailing' },
  { name: 'fuel', label: 'Fuel' },
  { name: 'parking', label: 'Parking' },
  { name: 'maintenance', label: 'Maintenance' },
  { name: 'rent', label: 'Rent' },
  { name: 'electricity', label: 'Electricity' },
  { name: 'water', label: 'Water' },
  { name: 'internet', label: 'Internet' },
  { name: 'subscriptions', label: 'Subscriptions' },
  { name: 'gaming', label: 'Gaming' },
  { name: 'hobbies', label: 'Hobbies' },
  { name: 'events', label: 'Events' },
  { name: 'clothing', label: 'Clothing' },
  { name: 'electronics', label: 'Electronics' },
  { name: 'personal-care', label: 'Personal Care' },
  { name: 'medical', label: 'Medical' },
  { name: 'pharmacy', label: 'Pharmacy' },
  { name: 'fitness', label: 'Fitness' },
  { name: 'flights', label: 'Flights' },
  { name: 'accommodation', label: 'Accommodation' },
  { name: 'vacation', label: 'Vacation' },
  { name: 'savings', label: 'Savings' },
  { name: 'investment', label: 'Investment' },
  { name: 'insurance', label: 'Insurance' },
  { name: 'gifts', label: 'Gifts' },
  { name: 'charity', label: 'Charity' },
  { name: 'misc', label: 'Misc' },
];

async function seed() {
  console.log('Seeding categories...');
  for (const item of data) {
    await db.insert(categories).values(item).onConflictDoNothing({ target: categories.name });
  }
  console.log('Done seeding categories.');
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
