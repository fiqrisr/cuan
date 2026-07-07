import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api';
import type { DashboardStatsResponse } from '../types';

export function useGetDashboardStatsQuery(filters?: {
  from?: string;
  to?: string;
  accountId?: string;
}) {
  return useQuery<DashboardStatsResponse>({
    queryKey: ['dashboard-stats', filters],
    queryFn: async () => {
      const res = await api.api.transactions.stats.get({
        query: {
          from: filters?.from,
          to: filters?.to,
          accountId: filters?.accountId,
        },
      });
      if (res.error) throw res.error;
      return res.data as DashboardStatsResponse;
    },
  });
}
