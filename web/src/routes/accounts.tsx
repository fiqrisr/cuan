import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/core/auth';
import { AccountsPage } from '@/modules/account';

export const Route = createFileRoute('/accounts')({
  beforeLoad: async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (!session) {
        throw redirect({ to: '/login' });
      }
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AccountsPage,
});
