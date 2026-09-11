import type { MaybePromise } from 'bun';
import { app } from './app';
import { setD1Binding } from './db';
import { type Env, getValidatedEnv } from './env';

type WorkerEnv = Env & { CLOUDFLARE_D1_BINDING_NAME: D1Database };

export default {
  fetch: (request: Request, workerEnv: WorkerEnv): MaybePromise<Response> => {
    const parsedEnv = getValidatedEnv(workerEnv);

    if (!parsedEnv.success) {
      const issues = parsedEnv.error.issues.map(
        issue => `${issue.path.join('.')}: ${issue.message}`,
      );
      throw new Error(`Invalid environment variables:\n${issues.join('\n')}`);
    }

    setD1Binding(workerEnv.CLOUDFLARE_D1_BINDING_NAME);
    return app.fetch(request) satisfies MaybePromise<Response>;
  },
};
