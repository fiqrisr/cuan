import { Button } from '@cuan/ui';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetAccountListQuery } from '@/modules/account/hooks/use-get-account-list-query';
import { useGetCategoriesQuery } from '@/modules/profile/hooks/use-get-categories-query';
import { ActivityFilterChips } from '../components/activity-filter-chips';
import { ActivityFiltersToolbar } from '../components/activity-filters-toolbar';
import { ActivityListView } from '../components/activity-list-view';
import { ActivityPagination } from '../components/activity-pagination';
import { ActivitySummaryBar } from '../components/activity-summary-bar';
import { CreateTransactionForm } from '../components/create-transaction-form';
import { TransactionEmptyState } from '../components/transaction-empty-state';
import { TransactionListSkeleton } from '../components/transaction-list-skeleton';
import { useGetTransactionListQuery } from '../hooks/use-get-transaction-list-query';
import type { ActivitySummaryMetrics, TransactionFilterParams } from '../types';

export function TransactionsPage({ accountId }: { accountId?: string }) {
  const { t } = useTranslation();
  const searchParams = (useSearch({ strict: false }) as TransactionFilterParams) ?? {};
  const navigate = useNavigate();

  const [localFilters, setLocalFilters] = useState<TransactionFilterParams>({
    page: 1,
    limit: 20,
    sort: 'date',
    order: 'desc',
    datePreset: 'all',
  });

  const [isCreating, setIsCreating] = useState(false);

  const effectiveFilters: TransactionFilterParams = {
    ...localFilters,
    ...searchParams,
    ...(accountId ? { accountId } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useGetTransactionListQuery(effectiveFilters);
  const { data: accountsData } = useGetAccountListQuery();
  const { data: categoriesData } = useGetCategoriesQuery();

  const accounts = accountsData?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const account = accounts.find(a => a.id === accountId);

  const title = account ? `${account.name} History` : t('transactions.title');
  const description = account
    ? `Review income and expenses for ${account.name}`
    : t('transactions.subtitle');

  const transactions = data?.data ?? [];
  const meta = data?.meta ?? {
    total: 0,
    page: effectiveFilters.page ?? 1,
    limit: effectiveFilters.limit ?? 20,
    totalPages: 1,
  };

  const isFiltered = Boolean(
    effectiveFilters.search ||
      effectiveFilters.type ||
      effectiveFilters.categoryId ||
      effectiveFilters.category ||
      (effectiveFilters.accountId && effectiveFilters.accountId !== accountId) ||
      (effectiveFilters.datePreset && effectiveFilters.datePreset !== 'all') ||
      effectiveFilters.from ||
      effectiveFilters.to ||
      effectiveFilters.minAmount !== undefined ||
      effectiveFilters.maxAmount !== undefined ||
      (effectiveFilters.sort &&
        (effectiveFilters.sort !== 'date' || effectiveFilters.order !== 'desc')),
  );

  // Prefer backend aggregated summary across all matching records
  let totalIncome = data?.meta?.summary?.totalIncome;
  let totalExpense = data?.meta?.summary?.totalExpense;
  let netCashflow = data?.meta?.summary?.netCashflow;

  if (totalIncome === undefined || totalExpense === undefined || netCashflow === undefined) {
    totalIncome = 0;
    totalExpense = 0;
    for (const tx of transactions) {
      const amt = Number(tx.amount);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else if (tx.type === 'expense') {
        totalExpense += amt;
      }
    }
    netCashflow = totalIncome - totalExpense;
  }

  const metrics: ActivitySummaryMetrics = {
    totalCount: meta.total,
    totalIncome,
    totalExpense,
    netCashflow,
    isFiltered,
  };

  const handleFilterChange = useCallback(
    (updates: Partial<TransactionFilterParams>) => {
      setLocalFilters(prev => ({ ...prev, ...updates }));
      try {
        navigate({
          search: ((prev: Record<string, unknown>) => {
            const next: Record<string, unknown> = { ...prev, ...updates };
            for (const key of Object.keys(updates)) {
              if (updates[key as keyof TransactionFilterParams] === undefined) {
                delete next[key];
              }
            }
            return next;
          }) as never,
        });
      } catch {
        // Safe navigation fallback
      }
    },
    [navigate],
  );

  const handleResetFilters = useCallback(() => {
    const reset: TransactionFilterParams = {
      page: 1,
      limit: effectiveFilters.limit ?? 20,
      sort: 'date',
      order: 'desc',
      datePreset: 'all',
      search: undefined,
      type: undefined,
      category: undefined,
      categoryId: undefined,
      accountId: accountId,
      from: undefined,
      to: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    };
    setLocalFilters(reset);
    try {
      navigate({
        search: (() => ({
          page: 1,
          limit: reset.limit,
          sort: 'date',
          order: 'desc',
          datePreset: 'all',
          ...(accountId ? { accountId } : {}),
        })) as never,
      });
    } catch {
      // Safe navigation fallback
    }
  }, [effectiveFilters.limit, accountId, navigate]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="px-5 pt-8 pb-28 lg:pb-10 sm:px-8 lg:px-16 xl:px-20 max-w-360 mx-auto w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="display-lg-mobile lg:headline-md text-foreground">{title}</h1>
            <p className="body-md text-muted-foreground mt-1.5 prose-short">{description}</p>
          </div>
          <Button
            type="button"
            onClick={() => setIsCreating(true)}
            disabled={isCreating || isLoading}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <Plus size={16} />
            <span>{t('transactions.addTransaction')}</span>
          </Button>
        </div>

        {/* Modal form */}
        {isCreating && (
          <CreateTransactionForm
            onSuccess={() => setIsCreating(false)}
            onCancel={() => setIsCreating(false)}
            defaultAccountId={accountId}
          />
        )}

        {/* Financial Summary Bar */}
        <ActivitySummaryBar metrics={metrics} isLoading={isLoading} />

        {/* Filter Controls & Search */}
        <div className="flex flex-col gap-2">
          <ActivityFiltersToolbar
            filters={effectiveFilters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            categories={categories}
            accounts={accounts}
            scopedAccountId={accountId}
          />

          {/* Active Filter Badges */}
          <ActivityFilterChips
            filters={effectiveFilters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            categories={categories}
            accounts={accounts}
            scopedAccountId={accountId}
          />
        </div>

        {/* Content Region */}
        {isLoading ? (
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <TransactionListSkeleton />
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive"
          >
            <p>{error instanceof Error ? error.message : 'Failed to load transactions.'}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="cursor-pointer"
            >
              {t('common.retry', 'Retry')}
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <TransactionEmptyState
            isFiltered={isFiltered}
            onResetFilters={handleResetFilters}
            onAddTransaction={() => setIsCreating(true)}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <ActivityListView transactions={transactions} />

            {/* Pagination Controls */}
            <ActivityPagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              pageSize={meta.limit}
              onPageChange={page => handleFilterChange({ page })}
              onPageSizeChange={size => handleFilterChange({ limit: size, page: 1 })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
