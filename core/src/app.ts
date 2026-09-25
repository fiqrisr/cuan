import { openapi } from '@elysia/openapi';
import { cors } from '@elysiajs/cors';
import { sql } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { HealthResponseDto, type HealthServiceStatus, RootResponseDto } from './app.dto';
import { db } from './db';
import { env } from './env';
import { errorHandler } from './middleware/error-handler';
import { logixlysiaLogger } from './middleware/logger';
import { AuthOpenAPI, auth } from './modules/auth';
import { categoryController } from './modules/category';
import { chatController } from './modules/chat/';
import { financialAccountController } from './modules/financial-account';
import { transactionController } from './modules/transaction';

const startedAt = Date.now();

export const app = new Elysia({
  adapter: CloudflareAdapter,
})
  .use(
    cors({
      origin: ['http://localhost:5173', ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : [])],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    }),
  )
  .use(logixlysiaLogger)
  .use(errorHandler)
  .use(
    openapi({
      documentation: {
        components: await AuthOpenAPI.components,
        paths: await AuthOpenAPI.getPaths(),
      },
    }),
  )
  .get(
    '/',
    () => ({
      name: 'cuan-core',
      version: '0.0.0',
      description: 'Cuan backend API powered by Elysia.js',
      environment: env.NODE_ENV ?? 'development',
      health: '/health',
      timestamp: new Date().toISOString(),
    }),
    {
      response: RootResponseDto,
      detail: {
        tags: ['System'],
        summary: 'API Index',
        description: 'Get API metadata and service information',
      },
    },
  )
  .get(
    '/health',
    async ({ set }) => {
      let dbStatus: HealthServiceStatus;
      try {
        const start = performance.now();
        await db.run(sql`SELECT 1`);
        const latencyMs = Math.round(performance.now() - start);
        dbStatus = {
          status: 'healthy',
          latencyMs,
        };
      } catch (error) {
        dbStatus = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Database check failed',
        };
      }

      const isHealthy = dbStatus.status === 'healthy';
      if (!isHealthy) {
        set.status = 503;
      }

      return {
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime:
          typeof process !== 'undefined' && typeof process.uptime === 'function'
            ? Math.floor(process.uptime())
            : Math.floor((Date.now() - startedAt) / 1000),
        environment: env.NODE_ENV ?? 'development',
        services: {
          database: dbStatus,
        },
      };
    },
    {
      response: {
        200: HealthResponseDto,
        503: HealthResponseDto,
      },
      detail: {
        tags: ['System'],
        summary: 'Health Check',
        description: 'Check service health and database connectivity',
      },
    },
  )
  .mount('/auth', auth.handler)
  .use(chatController)
  .use(financialAccountController)
  .use(categoryController)
  .use(transactionController);

app.compile();

export type App = typeof app;
