import type { MaybePromise } from 'bun';
import { app } from './app';
import { setD1Binding } from './db';
import { type Env, getValidatedEnv } from './env';

type WorkerEnv = Env & { CLOUDFLARE_D1_BINDING_NAME: D1Database };
function createCorsErrorResponse(
  request: Request,
  status: number,
  payload: { code: string; message: string; details?: unknown },
): Response {
  const origin = request.headers.get('origin');
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Vary', 'Origin');
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers,
  });
}

export default {
  fetch: (request: Request, workerEnv: WorkerEnv): MaybePromise<Response> => {
    try {
      const parsedEnv = getValidatedEnv(workerEnv);

      if (!parsedEnv.success) {
        const issues = parsedEnv.error.issues.map(
          issue => `${issue.path.join('.')}: ${issue.message}`,
        );
        const message = `Invalid environment variables:\n${issues.join('\n')}`;
        console.error(message);
        return createCorsErrorResponse(request, 500, {
          code: 'INVALID_ENVIRONMENT',
          message,
          details: issues,
        });
      }

      setD1Binding(workerEnv.CLOUDFLARE_D1_BINDING_NAME);
      return app.fetch(request) satisfies MaybePromise<Response>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      console.error('Unhandled Worker error:', error);
      return createCorsErrorResponse(request, 500, {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      });
    }
  },
};
