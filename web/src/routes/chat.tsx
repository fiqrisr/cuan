import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/core/auth';
import { ChatPage } from '@/modules/chat';

export const Route = createFileRoute('/chat')({
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
  component: ChatPage,
});
