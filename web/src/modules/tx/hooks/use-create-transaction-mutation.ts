import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api';

export type CreateTransactionParams = {
  type: 'expense' | 'income';
  amount: number;
  currency?: string;
  categoryId: number;
  description?: string;
  date: string;
  accountId?: string;
};

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTransactionParams) => {
      const { data, error } = await api.api.transactions.post(params);
      if (error) throw new Error(error.message || 'Failed to create transaction');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}
