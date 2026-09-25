import { Elysia } from 'elysia';
import { UnauthorizedError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { auth } from '.';

export const authGuard = new Elysia({ name: 'auth-guard' }).macro({
  auth: {
    async resolve({ request }) {
      const reqId = request.headers.get('x-request-id');
      const authLog = reqId ? logger.child({ requestId: reqId }) : logger;
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session) {
        authLog.warn(
          { event: 'auth_unauthorized', method: request.method, url: request.url },
          'Unauthorized access attempt',
        );
        throw new UnauthorizedError('Unauthorized');
      }

      const userLog = authLog.child({ userId: session.user.id });

      return {
        session: session.session,
        user: session.user,
        log: userLog,
      };
    },
  },
});

export type { AuthContext } from '@/modules/auth/auth.types';
