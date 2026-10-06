import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/core/http';
import type { TransactionFilterParams, TransactionListResponse } from '../types';

export function useGetTransactionListQuery(filters?: TransactionFilterParams) {
  return useQuery<TransactionListResponse>({
    queryKey: ['transactions', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string | number | undefined> = {
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 20,
      };

      if (filters?.type) query.type = filters.type;
      if (filters?.category) query.category = filters.category;
      if (filters?.categoryId) query.categoryId = filters.categoryId;
      if (filters?.accountId) query.accountId = filters.accountId;
      if (filters?.search) query.search = filters.search;
      if (filters?.minAmount !== undefined) query.minAmount = filters.minAmount;
      if (filters?.maxAmount !== undefined) query.maxAmount = filters.maxAmount;
      if (filters?.from) query.from = filters.from;
      if (filters?.to) query.to = filters.to;
      if (filters?.sort) query.sort = filters.sort;
      if (filters?.order) query.order = filters.order;

      const res = await api.api.transactions.get({
        query: query as never,
      });
      if (res.error) throw res.error;
      return res.data as unknown as TransactionListResponse;
    },
  });
}
