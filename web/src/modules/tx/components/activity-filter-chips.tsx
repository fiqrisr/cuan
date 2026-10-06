import { Button } from '@cuan/ui';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/modules/profile/hooks/use-get-categories-query';
import type { TransactionFilterParams } from '../types';

type AccountOption = {
  id: string;
  name: string;
};

type Props = {
  filters: TransactionFilterParams;
  onFilterChange: (updates: Partial<TransactionFilterParams>) => void;
  onResetFilters: () => void;
  categories?: Category[];
  accounts?: AccountOption[];
  scopedAccountId?: string;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function ActivityFilterChips({
  filters,
  onFilterChange,
  onResetFilters,
  categories = [],
  accounts = [],
  scopedAccountId,
}: Props) {
  const { t } = useTranslation();

  const chips: {
    key: string;
    label: string;
    onRemove: () => void;
  }[] = [];

  // Search chip
  if (filters.search) {
    chips.push({
      key: 'search',
      label: `${t('common.search')}: "${filters.search}"`,
      onRemove: () => onFilterChange({ search: undefined, page: 1 }),
    });
  }

  // Type chip
  if (filters.type) {
    chips.push({
      key: 'type',
      label:
        filters.type === 'expense'
          ? t('transactions.typeExpense', 'Expense')
          : t('transactions.typeIncome', 'Income'),
      onRemove: () => onFilterChange({ type: undefined, page: 1 }),
    });
  }

  // Date chip
  if (filters.datePreset && filters.datePreset !== 'all') {
    let dateLabel = '';
    switch (filters.datePreset) {
      case 'today':
        dateLabel = t('transactions.filterDateToday', 'Today');
        break;
      case 'this_week':
        dateLabel = t('transactions.filterDateThisWeek', 'This Week');
        break;
      case 'this_month':
        dateLabel = t('transactions.filterDateThisMonth', 'This Month');
        break;
      case 'last_30_days':
        dateLabel = t('transactions.filterDateLast30Days', 'Last 30 Days');
        break;
      case 'custom':
        dateLabel = `${filters.from?.slice(0, 10) ?? ''} - ${filters.to?.slice(0, 10) ?? ''}`;
        break;
    }

    chips.push({
      key: 'date',
      label: dateLabel,
      onRemove: () =>
        onFilterChange({ datePreset: 'all', from: undefined, to: undefined, page: 1 }),
    });
  } else if (filters.from || filters.to) {
    chips.push({
      key: 'custom-date',
      label: `${filters.from ? filters.from.slice(0, 10) : ''} - ${filters.to ? filters.to.slice(0, 10) : ''}`,
      onRemove: () => onFilterChange({ from: undefined, to: undefined, page: 1 }),
    });
  }

  // Account chip (only if not already scoped to this account in URL path)
  if (filters.accountId && filters.accountId !== scopedAccountId) {
    const acct = accounts.find(a => a.id === filters.accountId);
    chips.push({
      key: 'account',
      label: `${t('transactions.filterAccount', 'Account')}: ${acct ? acct.name : filters.accountId}`,
      onRemove: () => onFilterChange({ accountId: undefined, page: 1 }),
    });
  }

  // Category chip
  if (filters.categoryId) {
    const cat = categories.find(c => c.id === filters.categoryId);
    chips.push({
      key: 'categoryId',
      label: `${t('transactions.filterCategory', 'Category')}: ${cat ? cat.label : filters.categoryId}`,
      onRemove: () => onFilterChange({ categoryId: undefined, page: 1 }),
    });
  } else if (filters.category) {
    chips.push({
      key: 'category',
      label: `${t('transactions.filterCategory', 'Category')}: ${filters.category}`,
      onRemove: () => onFilterChange({ category: undefined, page: 1 }),
    });
  }

  // Amount range chips
  if (filters.minAmount !== undefined && filters.maxAmount !== undefined) {
    chips.push({
      key: 'amount-range',
      label: `${currencyFormatter.format(filters.minAmount)} - ${currencyFormatter.format(filters.maxAmount)}`,
      onRemove: () => onFilterChange({ minAmount: undefined, maxAmount: undefined, page: 1 }),
    });
  } else if (filters.minAmount !== undefined) {
    chips.push({
      key: 'min-amount',
      label: `≥ ${currencyFormatter.format(filters.minAmount)}`,
      onRemove: () => onFilterChange({ minAmount: undefined, page: 1 }),
    });
  } else if (filters.maxAmount !== undefined) {
    chips.push({
      key: 'max-amount',
      label: `≤ ${currencyFormatter.format(filters.maxAmount)}`,
      onRemove: () => onFilterChange({ maxAmount: undefined, page: 1 }),
    });
  }

  // Sort chip (if different from default date desc)
  if (filters.sort && (filters.sort !== 'date' || filters.order !== 'desc')) {
    const sortField =
      filters.sort === 'amount'
        ? t('transactions.filterSortAmount', 'Amount')
        : filters.sort === 'created_at'
          ? t('transactions.filterSortCreatedAt', 'Created')
          : t('transactions.filterSortDate', 'Date');
    const sortDir =
      filters.order === 'asc'
        ? t('transactions.filterSortAsc', 'Low-to-High / Oldest')
        : t('transactions.filterSortDesc', 'High-to-Low / Newest');

    chips.push({
      key: 'sort',
      label: `${t('transactions.filterSort', 'Sort')}: ${sortField} (${sortDir})`,
      onRemove: () => onFilterChange({ sort: 'date', order: 'desc', page: 1 }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
      <span className="text-xs text-muted-foreground font-medium mr-1">
        {t('transactions.activeFilters', 'Active Filters')}:
      </span>
      {chips.map(chip => {
        const isExpense = chip.key === 'type' && filters.type === 'expense';
        const isIncome = chip.key === 'type' && filters.type === 'income';

        return (
          <div
            key={chip.key}
            className={`inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 text-xs font-medium rounded-full border transition-all ${
              isExpense
                ? 'bg-destructive/10 text-destructive border-destructive/25'
                : isIncome
                  ? 'bg-success/10 text-success border-success/25'
                  : 'bg-card text-foreground border-border shadow-2xs hover:border-border-strong hover:bg-muted/40'
            }`}
          >
            <span className="truncate max-w-[240px]">{chip.label}</span>
            <button
              type="button"
              onClick={chip.onRemove}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isExpense
                  ? 'hover:bg-destructive/20 text-destructive/70 hover:text-destructive'
                  : isIncome
                    ? 'hover:bg-success/20 text-success/70 hover:text-success'
                    : 'hover:bg-foreground/10 text-muted-foreground hover:text-foreground'
              }`}
              aria-label={`Remove filter: ${chip.label}`}
            >
              <X size={12} strokeWidth={2.2} />
            </button>
          </div>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        onClick={onResetFilters}
        className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/60"
      >
        {t('transactions.resetAllFilters', 'Clear All')}
      </Button>
    </div>
  );
}
