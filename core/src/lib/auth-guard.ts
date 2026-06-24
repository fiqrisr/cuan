import { Elysia } from 'elysia';
import { auth } from './auth';

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

export type AuthContext = {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};
