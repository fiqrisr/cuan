import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api';
import type { TransactionListResponse } from '../types';

export function useGetTransactionListQuery() {
  return useQuery<TransactionListResponse>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await api.api.transactions.get({ query: { limit: 50, page: 1 } });
      if (res.error) throw res.error;
      return res.data as TransactionListResponse;
    },
  });
}
