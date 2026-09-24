import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/http';

export type UpdateTransactionParams = {
  id: string;
  amount?: number;
  description?: string;
  categoryId?: number;
  date?: string;
  type?: 'expense' | 'income';
  accountId?: string;
};

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateTransactionParams) => {
      const { data, error } = await api.api.transactions({ id: id }).patch(params);
      if (error)
        throw new Error(
          (error as { value?: { message?: string }; message?: string }).value?.message ||
            (error as { message?: string }).message ||
            'Failed to update transaction',
        );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}
