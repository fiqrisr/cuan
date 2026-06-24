import { Elysia } from 'elysia';
import { openapi } from '@elysia/openapi';
import { auth, OpenAPI } from './lib/auth';
import { chatRoutes } from './routes/chat';

export async function createApp() {
  return new Elysia()
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
    .use(chatRoutes)
    .onError(({ code, error, set }) => {
      console.error(`[${code}]`, error);
      if (code === 'NOT_FOUND') {
        set.status = 404;
        return { error: 'Not found' };
      }
      set.status = 500;
      return { error: 'Internal server error' };
    });
}
