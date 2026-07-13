import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api';

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api.transactions({ id: id }).delete();
      if (error) throw new Error(error.message || 'Failed to delete transaction');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}
