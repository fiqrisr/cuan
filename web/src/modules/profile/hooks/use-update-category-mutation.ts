import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api';

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, label }: { id: number; name?: string; label?: string }) => {
      const res = await api.api.categories({ id }).patch({ name, label });
      if (res.error) throw new Error(res.error.value?.message || 'Failed to update category');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
