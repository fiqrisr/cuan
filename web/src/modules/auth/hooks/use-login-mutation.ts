import { useMutation } from '@tanstack/react-query';
import { authClient } from '@/core/auth';

export function useLoginMutation() {
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message || 'Login failed');
    },
  });

  return { mutateAsync, isPending, error };
}
