import { openapi } from '@elysia/openapi';
import { Elysia } from 'elysia';
import { errorHandler } from './middleware/error-handler';
import { logixlysiaLogger } from './middleware/logger';
import { AuthOpenAPI, auth } from './modules/auth';
import { categoryController } from './modules/category';
import { chatController } from './modules/chat/';
import { financialAccountController } from './modules/financial-account';
import { transactionController } from './modules/transaction';

export const app = new Elysia()
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
  .get('/health', () => ({ status: 'ok' }))
  .mount('/auth', auth.handler)
  .use(chatController)
  .use(financialAccountController)
  .use(categoryController)
  .use(transactionController);
