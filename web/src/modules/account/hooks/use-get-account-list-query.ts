import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api';
import type { FinancialAccountListResponse } from '../types';

export function useGetAccountListQuery() {
  return useQuery<FinancialAccountListResponse>({
    queryKey: ['financial-accounts'],
    queryFn: async () => {
      const res = await api.api['financial-accounts'].get();
      if (res.error) throw res.error;
      return res.data as FinancialAccountListResponse;
    },
  });
}
