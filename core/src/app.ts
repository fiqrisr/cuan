import { openapi } from '@elysia/openapi';
import { Elysia } from 'elysia';
import { auth, OpenAPI } from './lib/auth';
import { logixlysiaLogger } from './lib/logger';
import { chatController } from './modules/chat/chat.controller';
import { financialAccountController } from './modules/financial-account/financial-account.controller';
import { transactionController } from './modules/transaction/transaction.controller';

export const app = new Elysia()
  .use(logixlysiaLogger)
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .get('/health', () => ({ status: 'ok' }))
  .mount('/auth', auth.handler)
  .use(chatController)
  .use(financialAccountController)
  .use(transactionController);
