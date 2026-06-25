import { openapi } from '@elysia/openapi';
import { Elysia } from 'elysia';
import { auth, OpenAPI } from './lib/auth';
import { chatController } from './modules/chat/chat.controller';

export const app = new Elysia()
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
  .onError(({ code, error, set }) => {
    console.error(`[${code}]`, error);
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Not found' };
    }
    set.status = 500;
    return { error: 'Internal server error' };
  });
