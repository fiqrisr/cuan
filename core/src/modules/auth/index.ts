import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';
import { db } from '@/db';
import { env } from '@/env';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  basePath: '/api',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  plugins: [openAPI()],
});

let _schema: Promise<{ paths: Record<string, unknown>; components: Record<string, unknown> }>;
const getSchema = () => {
  // biome-ignore lint: single-assignment cache
  _schema ??= auth.api.generateOpenAPISchema() as any;
  return _schema;
};
export const AuthOpenAPI = {
  getPaths: (prefix = '/auth/api') =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);
      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path];
        const refObj = reference as Record<string, Record<string, { tags?: string[] }>>;
        for (const method of Object.keys(paths[path] as Record<string, unknown>)) {
          const operation = refObj[key][method];
          operation.tags = ['Better Auth'];
        }
      }
      return reference;
      // biome-ignore lint/suspicious/noExplicitAny: required for elysia openapi
    }) as Promise<any>,
  // biome-ignore lint/suspicious/noExplicitAny: required for elysia openapi
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;

export * from './auth.schema';
export * from './auth.types';
export * from './auth-guard';
