import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/http';

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, label }: { name: string; label: string }) => {
      const res = await api.api.categories.post({ name, label });
      if (res.error) throw new Error(res.error.value?.message || 'Failed to create category');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
