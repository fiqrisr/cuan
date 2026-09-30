import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router';
import { authClient } from '@/core/http';
import { LoginPage } from '@/modules/auth';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session) {
        throw redirect({ to: '/' });
      }
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }
    }
  },
  component: LoginPage,
});
