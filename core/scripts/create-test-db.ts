import { Client } from 'pg';

async function main(): Promise<void> {
  const client = new Client('postgresql://postgres:postgres@localhost:5433/postgres');
  await client.connect();

  try {
    await client.query('CREATE DATABASE "cuan-test"');
    console.log('Created test database "cuan-test"');
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string' &&
      error.code === '42P04'
    ) {
      console.log('Test database "cuan-test" already exists');
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
