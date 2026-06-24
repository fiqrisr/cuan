import { Client } from 'pg';

async function main(): Promise<void> {
  const client = new Client('postgresql://postgres:postgres@localhost:5433/postgres');
  await client.connect();

  await client.query('DROP DATABASE IF EXISTS cuan');
  await client.query('CREATE DATABASE cuan');
  console.log('Reset dev database "cuan"');

  await client.end();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
