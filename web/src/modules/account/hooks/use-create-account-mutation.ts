import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api';

type CreateAccountParams = {
  name: string;
  type?: string;
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
      if (error) throw new Error(error.message || 'Failed to create account');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}
