import { z } from 'zod';

const commonEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const openmodelEnvSchema = commonEnvSchema.merge(
  z.object({
    AI_PROVIDER: z.literal('openmodel'),
    OPENMODEL_API_KEY: z.string().min(1),
    OPENMODEL_BASE_URL: z.url().min(1),
    OPENMODEL_MODEL: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1).optional(),
    GEMINI_MODEL: z.string().min(1).optional(),
  }),
);

const geminiEnvSchema = commonEnvSchema.merge(
  z.object({
    AI_PROVIDER: z.literal('gemini'),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_MODEL: z.string().min(1),
    OPENMODEL_API_KEY: z.string().min(1).optional(),
    OPENMODEL_BASE_URL: z.url().min(1).optional(),
    OPENMODEL_MODEL: z.string().min(1).optional(),
  }),
);

const envSchema = z.preprocess(
  value => {
    if (typeof value === 'object' && value !== null && !('AI_PROVIDER' in value)) {
      return { ...value, AI_PROVIDER: 'openmodel' };
    }
    return value;
  },
  z.discriminatedUnion('AI_PROVIDER', [openmodelEnvSchema, geminiEnvSchema]),
);

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
