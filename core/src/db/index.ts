import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { drizzle } from 'drizzle-orm/d1';
import type { PlatformProxy } from 'wrangler';
import { getPlatformProxy } from 'wrangler';
import * as schema from './schema';

type D1Binding = typeof CLOUDFLARE_D1_BINDING_NAME;
type Proxy = PlatformProxy<{ CLOUDFLARE_D1_BINDING_NAME: D1Binding }>;

const globalScope = globalThis as typeof globalThis & {
  CLOUDFLARE_D1_BINDING_NAME?: D1Binding;
};

let d1Binding: D1Binding | undefined = globalScope.CLOUDFLARE_D1_BINDING_NAME;

if (!d1Binding) {
  const platformProxy: Proxy = await getPlatformProxy({
    configPath: `${import.meta.dir}/../../wrangler.toml`,
  });
  d1Binding = platformProxy.env.CLOUDFLARE_D1_BINDING_NAME;
}

if (!d1Binding) {
  throw new Error(
    'D1 binding "CLOUDFLARE_D1_BINDING_NAME" is not available. ' +
      'Make sure it is declared in wrangler.toml.',
  );
}

export const db: DrizzleD1Database<typeof schema> = drizzle(d1Binding, { schema });

export * from './schema';
