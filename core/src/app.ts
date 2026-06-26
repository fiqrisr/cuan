import { openapi } from '@elysia/openapi';
import { Elysia } from 'elysia';
import type {} from 'pino';
import { auth, OpenAPI } from './lib/auth';
import { loggerMiddleware } from './lib/logger-middleware';
import { chatController } from './modules/chat/chat.controller';
import { financialAccountController } from './modules/financial-account/financial-account.controller';
import { transactionController } from './modules/transaction/transaction.controller';

export const app = new Elysia()
  .use(loggerMiddleware)
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
  .use(transactionController)
  .onError(context => {
    const { code, error, set } = context;

    // Error is logged by logixlysia automatically usually, but if we want to log it manually:
    if (context.store && 'logger' in context.store) {
      const pino = (context.store as { pino?: { error: (obj: unknown, msg: string) => void } })
        .pino;
      if (pino) {
        pino.error(
          { event: 'http_request_error', errorCode: code, err: error },
          'http request failed',
        );
      }
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Not found' };
    }
    set.status = 500;
    return { error: 'Internal server error' };
  });
