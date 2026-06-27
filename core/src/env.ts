import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().optional(),
  OPENMODEL_API_KEY: z.string().min(1),
  OPENMODEL_BASE_URL: z.url().min(1),
  OPENMODEL_MODEL: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid environment variables:\n${issues.join('\n')}`);
}

export const env = {
  ...parsed.data,
  BETTER_AUTH_URL: parsed.data.BETTER_AUTH_URL ?? `http://localhost:${parsed.data.PORT}`,
};

export type Env = typeof env;
