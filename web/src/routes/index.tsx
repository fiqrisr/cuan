import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/core/auth';
import { DashboardPage } from '@/modules/dashboard/pages/dashboard-page';

export const Route = createFileRoute('/')({
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
  component: DashboardPage,
});
