import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/http';
import type { TransactionListResponse } from '../types';

export function useGetTransactionListQuery(filters?: { accountId?: string }) {
  return useQuery<TransactionListResponse>({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const res = await api.api.transactions.get({
        query: {
          limit: '50',
          page: '1',
          accountId: filters?.accountId,
        },
      });
      if (res.error) throw res.error;
      return res.data as TransactionListResponse;
    },
  });
}
