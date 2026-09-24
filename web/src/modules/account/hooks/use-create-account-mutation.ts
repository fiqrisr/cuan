import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/http';

type CreateAccountParams = {
  name: string;
  type?: 'bank' | 'cash' | 'e-wallet' | 'other';
  currency?: string;
  initialBalance?: number;
};

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAccountParams) => {
      const { data, error } = await api.api['financial-accounts'].post({
        ...params,
        type: params.type || 'bank',
        initialBalance: params.initialBalance || 0,
      });
      if (error)
        throw new Error(
          (error as { value?: { message?: string }; message?: string }).value?.message ||
            (error as { message?: string }).message ||
            'Failed to create account',
        );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}
