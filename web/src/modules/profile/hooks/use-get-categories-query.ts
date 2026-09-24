import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/http';

export type Category = {
  id: number;
  name: string;
  label: string;
  userId: string | null;
};

export function useGetCategoriesQuery() {
  return useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.api.categories.get();
      if (res.error) throw new Error(res.error.value?.message || 'Failed to fetch categories');
      return res.data as { data: Category[] };
    },
  });
}
