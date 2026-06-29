import { Elysia } from 'elysia';
import { UnauthorizedError } from '@/lib/error';
import { auth } from '.';

export const authGuard = new Elysia({ name: 'auth-guard' }).macro({
  auth: {
    async resolve({ request }) {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session) {
        throw new UnauthorizedError('Unauthorized');
      }

      return {
        session: session.session,
        user: session.user,
      };
    },
  },
});

export type { AuthContext } from '@/modules/auth/auth.types';
