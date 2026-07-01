import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/core/auth';
import { TransactionsPage } from '@/modules/tx';

export const Route = createFileRoute('/transactions')({
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
  component: TransactionsPage,
});
