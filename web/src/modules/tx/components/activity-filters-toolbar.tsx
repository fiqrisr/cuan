import { Button, Input } from '@cuan/ui';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/modules/profile/hooks/use-get-categories-query';
import type { DatePreset, TransactionFilterParams } from '../types';
import { getDateRangeForPreset } from '../utils/date-presets';
import { DateRangePicker } from './date-range-picker';

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

export function ActivityFiltersToolbar({
  filters,
  onFilterChange,
  onResetFilters,
  categories = [],
  accounts = [],
  scopedAccountId,
}: Props) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Sync internal search input with external filters
  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  // Debounced search update
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim();
      const current = filters.search ?? '';
      if (trimmed !== current) {
        onFilterChange({
          search: trimmed.length > 0 ? trimmed : undefined,
          page: 1,
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, filters.search, onFilterChange]);

  const activeAdvancedCount = [
    Boolean(filters.categoryId || filters.category),
    Boolean(filters.accountId && filters.accountId !== scopedAccountId),
    filters.minAmount !== undefined,
    filters.maxAmount !== undefined,
    filters.sort && (filters.sort !== 'date' || filters.order !== 'desc'),
  ].filter(Boolean).length;

  const handleTypeSelect = (type?: 'expense' | 'income') => {
    onFilterChange({ type, page: 1 });
  };

  const handleDatePresetSelect = (preset: DatePreset) => {
    const { from, to } = getDateRangeForPreset(preset);
    onFilterChange({
      datePreset: preset,
      from,
      to,
      page: 1,
    });
  };

  const datePresets: { id: DatePreset; label: string }[] = [
    { id: 'all', label: t('transactions.filterDateAll', 'All Time') },
    { id: 'today', label: t('transactions.filterDateToday', 'Today') },
    { id: 'this_week', label: t('transactions.filterDateThisWeek', 'This Week') },
    { id: 'this_month', label: t('transactions.filterDateThisMonth', 'This Month') },
    { id: 'last_30_days', label: t('transactions.filterDateLast30Days', '30 Days') },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Primary Toolbar Row */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <Input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t('transactions.searchPlaceholder', 'Search descriptions or notes...')}
            className="pl-9 pr-8 h-10 w-full bg-card border-border shadow-xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onFilterChange({ search: undefined, page: 1 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Type & More Filters Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {/* Transaction Type Segmented Control */}
          <div className="flex items-center p-1 rounded-lg bg-card border border-border shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => handleTypeSelect(undefined)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                !filters.type
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('common.all', 'All')}
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('expense')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filters.type === 'expense'
                  ? 'bg-destructive/15 text-destructive font-semibold border border-destructive/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpIcon size={12} className="text-destructive" />
              <span>{t('transactions.typeExpense', 'Expense')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('income')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filters.type === 'income'
                  ? 'bg-success/15 text-success font-semibold border border-success/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownIcon size={12} className="text-success" />
              <span>{t('transactions.typeIncome', 'Income')}</span>
            </button>
          </div>

          {/* Advanced Filters Toggle Button */}
          <Button
            type="button"
            variant={activeAdvancedCount > 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAdvancedOpen(prev => !prev)}
            className="h-9 gap-1.5 px-3 shrink-0 shadow-xs cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            <span>{t('transactions.filterBtn', 'Filters')}</span>
            {activeAdvancedCount > 0 && (
              <span className="ml-1 h-4 min-w-4 px-1 rounded-full text-[10px] leading-none flex items-center justify-center font-semibold bg-primary-foreground/20 text-primary-foreground">
                {activeAdvancedCount}
              </span>
            )}
            {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </div>

      {/* Date Presets Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-xs text-muted-foreground font-medium mr-1 shrink-0 flex items-center gap-1">
          <Calendar size={13} />
          {t('transactions.filterPeriod', 'Period')}:
        </span>
        {datePresets.map(preset => {
          const isSelected = (filters.datePreset || 'all') === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleDatePresetSelect(preset.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold border-primary shadow-xs'
                  : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
        <DateRangePicker
          className="shrink-0"
          from={filters.datePreset === 'custom' ? filters.from : undefined}
          to={filters.datePreset === 'custom' ? filters.to : undefined}
          onSelectRange={range =>
            onFilterChange(
              range
                ? { datePreset: 'custom', from: range.from, to: range.to, page: 1 }
                : { datePreset: 'all', from: undefined, to: undefined, page: 1 },
            )
          }
        />
      </div>

      {/* Advanced Filter Drawer / Panel */}
      {isAdvancedOpen && (
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col gap-4 mt-1 transition-all animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {t('transactions.advancedFilters', 'Detailed Filters')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeAdvancedCount > 0 && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>{t('transactions.resetAllFilters', 'Reset')}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Account Selector (if not on account-scoped page) */}
            {!scopedAccountId && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="filter-account"
                  className="text-xs font-medium text-muted-foreground"
                >
                  {t('transactions.filterAccount', 'Account')}
                </label>
                <select
                  id="filter-account"
                  value={filters.accountId ?? ''}
                  onChange={e =>
                    onFilterChange({
                      accountId: e.target.value ? e.target.value : undefined,
                      page: 1,
                    })
                  }
                  className="h-9 px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">{t('transactions.allAccounts', 'All Accounts')}</option>
                  {accounts.map(acct => (
                    <option key={acct.id} value={acct.id}>
                      {acct.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Selector */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="filter-category"
                className="text-xs font-medium text-muted-foreground"
              >
                {t('transactions.filterCategory', 'Category')}
              </label>
              <select
                id="filter-category"
                value={filters.categoryId ? String(filters.categoryId) : ''}
                onChange={e =>
                  onFilterChange({
                    categoryId: e.target.value ? Number(e.target.value) : undefined,
                    category: undefined,
                    page: 1,
                  })
                }
                className="h-9 px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t('transactions.allCategories', 'All Categories')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-sort" className="text-xs font-medium text-muted-foreground">
                {t('transactions.filterSort', 'Sort By')}
              </label>
              <select
                id="filter-sort"
                value={`${filters.sort || 'date'}_${filters.order || 'desc'}`}
                onChange={e => {
                  const [sortField, sortOrder] = e.target.value.split('_') as [
                    'date' | 'amount' | 'created_at',
                    'asc' | 'desc',
                  ];
                  onFilterChange({
                    sort: sortField,
                    order: sortOrder,
                    page: 1,
                  });
                }}
                className="h-9 px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="date_desc">{t('transactions.sortDateDesc', 'Date (Newest)')}</option>
                <option value="date_asc">{t('transactions.sortDateAsc', 'Date (Oldest)')}</option>
                <option value="amount_desc">
                  {t('transactions.sortAmountDesc', 'Amount (Highest)')}
                </option>
                <option value="amount_asc">
                  {t('transactions.sortAmountAsc', 'Amount (Lowest)')}
                </option>
                <option value="created_at_desc">
                  {t('transactions.sortCreatedDesc', 'Created (Latest)')}
                </option>
              </select>
            </div>

            {/* Amount Range */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-min-amt" className="text-xs font-medium text-muted-foreground">
                {t('transactions.amountRange', 'Amount Range (IDR)')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="filter-min-amt"
                  type="number"
                  min="0"
                  step="10000"
                  placeholder={t('transactions.minAmount', 'Min')}
                  value={filters.minAmount !== undefined ? filters.minAmount : ''}
                  onChange={e =>
                    onFilterChange({
                      minAmount: e.target.value ? Number(e.target.value) : undefined,
                      page: 1,
                    })
                  }
                  className="h-9 text-xs"
                />
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder={t('transactions.maxAmount', 'Max')}
                  value={filters.maxAmount !== undefined ? filters.maxAmount : ''}
                  onChange={e =>
                    onFilterChange({
                      maxAmount: e.target.value ? Number(e.target.value) : undefined,
                      page: 1,
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
