import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/core/http';
import { TransactionsPage } from '@/modules/tx';
import type { DatePreset, TransactionFilterParams } from '@/modules/tx/types';

export const Route = createFileRoute('/accounts/$accountId/transactions')({
  validateSearch: (search: Record<string, unknown>): TransactionFilterParams => {
    return {
      page: search.page ? Number(search.page) : 1,
      limit: search.limit ? Number(search.limit) : 20,
      search: typeof search.search === 'string' && search.search ? search.search : undefined,
      type: search.type === 'expense' || search.type === 'income' ? search.type : undefined,
      category:
        typeof search.category === 'string' && search.category ? search.category : undefined,
      categoryId: search.categoryId ? Number(search.categoryId) : undefined,
      from: typeof search.from === 'string' && search.from ? search.from : undefined,
      to: typeof search.to === 'string' && search.to ? search.to : undefined,
      datePreset: (['all', 'today', 'this_week', 'this_month', 'last_30_days', 'custom'].includes(
        search.datePreset as string,
      )
        ? search.datePreset
        : 'all') as DatePreset,
      minAmount:
        search.minAmount !== undefined && search.minAmount !== ''
          ? Number(search.minAmount)
          : undefined,
      maxAmount:
        search.maxAmount !== undefined && search.maxAmount !== ''
          ? Number(search.maxAmount)
          : undefined,
      sort: (['date', 'amount', 'created_at'].includes(search.sort as string)
        ? search.sort
        : 'date') as 'date' | 'amount' | 'created_at',
      order: (search.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
    };
  },
  beforeLoad: async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (!session) {
        throw redirect({ to: '/login' });
      }
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: function AccountTransactionsPage() {
    const { accountId } = Route.useParams();
    return <TransactionsPage accountId={accountId} />;
  },
});
