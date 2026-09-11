import { openapi } from '@elysia/openapi';
import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { env } from './env';
import { errorHandler } from './middleware/error-handler';
import { logixlysiaLogger } from './middleware/logger';
import { AuthOpenAPI, auth } from './modules/auth';
import { categoryController } from './modules/category';
import { chatController } from './modules/chat/';
import { financialAccountController } from './modules/financial-account';
import { transactionController } from './modules/transaction';

export const app = new Elysia({
  adapter: CloudflareAdapter,
})
  .use(
    cors({
      origin: ['http://localhost:5173', ...(env.FRONTEND_URL ?? '')],
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
  .get('/', () => 'Hello')
  .get('/health', () => ({ status: 'ok' }))
  .mount('/auth', auth.handler)
  .use(chatController)
  .use(financialAccountController)
  .use(categoryController)
  .use(transactionController);

app.compile();

export type App = typeof app;
