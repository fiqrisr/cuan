import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/http';

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api.transactions({ id: id }).delete();
      if (error)
        throw new Error(
          (error as { value?: { message?: string }; message?: string }).value?.message ||
            (error as { message?: string }).message ||
            'Failed to delete transaction',
        );
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}
