import { Elysia } from 'elysia';
import { auth } from '.';

export const authGuard = new Elysia({ name: 'auth-guard' }).macro({
  auth: {
    async resolve({ request, set }) {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session) {
        set.status = 401;
        throw new Error('Unauthorized');
      }

      return {
        session: session.session,
        user: session.user,
      };
    },
  },
});

export type { AuthContext } from '@/modules/auth/auth.types';
