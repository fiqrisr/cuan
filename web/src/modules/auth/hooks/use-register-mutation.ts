import { useMutation } from '@tanstack/react-query';
import { authClient } from '@/core/auth';

export function useRegisterMutation() {
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) throw new Error(error.message || 'Registration failed');
    },
  });

  return { mutateAsync, isPending, error };
}
