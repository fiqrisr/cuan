import { drizzle } from 'drizzle-orm/d1';
import type { AnyD1Database, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

type D1Binding = AnyD1Database;
type Db = DrizzleD1Database<typeof schema>;

const globalScope = globalThis as typeof globalThis & {
  CLOUDFLARE_D1_BINDING_NAME?: D1Binding;
};

let d1Binding: D1Binding | undefined;
let instance: Db | undefined;

/**
 * Wire the D1 binding from the runtime environment (Worker `env`,
 * wrangler platform proxy, or test preload) before the first query.
 */
export function setD1Binding(binding: D1Binding): void {
  if (binding !== d1Binding) {
    d1Binding = binding;
    instance = undefined;
  }
}

function getDb(): Db {
  const binding = d1Binding ?? globalScope.CLOUDFLARE_D1_BINDING_NAME;
  if (!binding) {
    throw new Error(
      'D1 binding "CLOUDFLARE_D1_BINDING_NAME" is not available. ' +
        'Make sure it is declared in wrangler.toml and set via setD1Binding().',
    );
  }
  instance ??= drizzle(binding, { schema });
  return instance;
}

/**
 * Lazy singleton: the D1 binding only exists at request time (module Workers
 * receive it via `env`), so database access is deferred until the first query
 * instead of module import. The Proxy keeps the `db` import shape unchanged.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === 'function'
      ? (value as (...args: never[]) => unknown).bind(real)
      : value;
  },
  has(_target, prop) {
    return prop in (getDb() as unknown as Record<string | symbol, unknown>);
  },
});

export * from './schema';
