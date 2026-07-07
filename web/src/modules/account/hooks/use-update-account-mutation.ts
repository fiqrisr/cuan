import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api';

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      isDefault,
    }: {
      id: string;
      name?: string;
      isDefault?: boolean;
    }) => {
      const res = await api.api['financial-accounts']({ id }).patch({
        name,
        isDefault,
      });
      if (res.error) {
        throw new Error(res.error.value?.message || 'Failed to update account');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
