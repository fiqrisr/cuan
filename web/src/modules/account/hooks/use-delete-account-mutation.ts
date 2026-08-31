import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api';

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.api['financial-accounts']({ id: id }).delete();
      if (error)
        throw new Error(
          (error as { value?: { message?: string }; message?: string }).value?.message ||
            (error as { message?: string }).message ||
            'Failed to delete account',
        );
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}
