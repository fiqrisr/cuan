import { useMutation } from '@tanstack/react-query';
import { authClient } from '@/core/auth';
import { useRouter } from '@tanstack/react-router';

export function useLogoutMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message || 'Logout failed');
    },
    onSuccess: () => {
      router.navigate({ to: '/login' });
    },
  });
}
