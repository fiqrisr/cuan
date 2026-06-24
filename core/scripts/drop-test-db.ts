import { Client } from 'pg';

async function main(): Promise<void> {
  const client = new Client('postgresql://postgres:postgres@localhost:5433/postgres');
  await client.connect();

  await client.query('DROP DATABASE IF EXISTS "cuan-test"');
  console.log('Dropped test database "cuan-test"');

  await client.end();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
