import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';
import { db } from '@/db';
import { env } from '@/env';
import { account, session, user, verification } from './auth.schema';

const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
const defaultDevBaseURL = `http://localhost:${env.PORT}`;
const baseURL =
  env.BETTER_AUTH_URL && !(isDev && env.BETTER_AUTH_URL.startsWith('https://core.cuan.fiqri.dev'))
    ? env.BETTER_AUTH_URL
    : isDev
      ? defaultDevBaseURL
      : env.BETTER_AUTH_URL;

const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

const trustedOrigins = [
  ...new Set([...(isDev ? devOrigins : []), ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : [])]),
];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: { user, session, account, verification },
  }),
  basePath: '/api',
  baseURL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  plugins: [openAPI()],
  advanced: {
    crossSubDomainCookies: {
      enabled: env.NODE_ENV === 'production',
    },
  },
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
