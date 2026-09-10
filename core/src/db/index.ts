import { drizzle } from 'drizzle-orm/d1';
import { env } from '@/env';
import * as schema from './schema';

export const db = drizzle(env.CLOUDFLARE_D1_BINDING_NAME, {
  schema,
});

export * from './schema';
