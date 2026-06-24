import { Elysia } from 'elysia';
import { auth } from './lib/auth';
import { chatRoutes } from './routes/chat';

export function createApp() {
  return new Elysia()
    .get('/health', () => ({ status: 'ok' }))
    .all('/api/auth/*', ({ request }) => auth.handler(request))
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
