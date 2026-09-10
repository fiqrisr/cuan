import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export const db = drizzle(process.env.CLOUDFLARE_D1_BINDING_NAME, {
  schema,
});

export * from './schema';
