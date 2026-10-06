import { Badge, Skeleton } from '@cuan/ui';
import { ArrowDownLeft, ArrowUpRight, Hash, Info, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ActivitySummaryMetrics } from '../types';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

type Props = {
  metrics: ActivitySummaryMetrics;
  isLoading?: boolean;
};

export function ActivitySummaryBar({ metrics, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div
              key={idx}
              className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border shadow-xs"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isNetPositive = metrics.netCashflow >= 0;
  const isFiltered = Boolean(metrics.isFiltered);

  const scopeBadge = isFiltered
    ? t('transactions.summaryBadgeFiltered', 'Filtered Selection')
    : t('transactions.summaryBadgeAllTime', 'All-Time Total');

  const scopeDescription = isFiltered
    ? t(
        'transactions.summaryScopeFilteredDesc',
        'Totals aggregated for matching records in active filter',
      )
    : t(
        'transactions.summaryScopeAllTimeDesc',
        'Cumulative totals across all recorded transactions',
      );

  const cards = [
    {
      label: isFiltered
        ? t('transactions.summaryFilteredCount', 'Matching Records')
        : t('transactions.summaryTotalCount', 'Total Records'),
      value: metrics.totalCount.toLocaleString(),
      subtext: isFiltered
        ? t('transactions.subtextFilteredRecords', 'In active filter')
        : t('transactions.subtextAllTimeRecords', 'All-time total'),
      icon: Hash,
      iconColor: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
    },
    {
      label: isFiltered
        ? t('transactions.summaryFilteredIncome', 'Filtered Income')
        : t('transactions.summaryAllTimeIncome', 'All-Time Income'),
      value: currencyFormatter.format(metrics.totalIncome),
      subtext: isFiltered
        ? t('transactions.subtextFilteredIncome', 'Total inflow in filter')
        : t('transactions.subtextAllTimeIncome', 'All-time inflow'),
      icon: ArrowDownLeft,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: isFiltered
        ? t('transactions.summaryFilteredExpense', 'Filtered Expenses')
        : t('transactions.summaryAllTimeExpense', 'All-Time Expenses'),
      value: currencyFormatter.format(metrics.totalExpense),
      subtext: isFiltered
        ? t('transactions.subtextFilteredExpense', 'Total outflow in filter')
        : t('transactions.subtextAllTimeExpense', 'All-time outflow'),
      icon: ArrowUpRight,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: isFiltered
        ? t('transactions.summaryFilteredNet', 'Filtered Net Flow')
        : t('transactions.summaryAllTimeNet', 'Net Balance'),
      value: `${isNetPositive ? '+' : ''}${currencyFormatter.format(metrics.netCashflow)}`,
      subtext: isFiltered
        ? t('transactions.subtextFilteredNet', 'Income - Expenses')
        : t('transactions.subtextAllTimeNet', 'Net cumulative flow'),
      icon: Scale,
      iconColor: isNetPositive ? 'text-success' : 'text-destructive',
      bgColor: isNetPositive ? 'bg-success/10' : 'bg-destructive/10',
    },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      {/* Scope / Clarification Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            {t('transactions.summaryOverviewTitle', 'Financial Summary')}
          </span>
          <Badge
            variant={isFiltered ? 'default' : 'secondary'}
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isFiltered
                ? 'bg-primary/15 text-primary border border-primary/25'
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {scopeBadge}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Info size={12} className="shrink-0" />
          <span>{scopeDescription}</span>
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex flex-col justify-between p-3.5 sm:p-4 rounded-xl bg-card border border-border shadow-xs transition-colors hover:border-border-strong/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {card.label}
                </span>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bgColor} ${card.iconColor} shrink-0`}
                >
                  <Icon size={15} strokeWidth={2.2} />
                </div>
              </div>
              <div className="mt-2.5 flex flex-col gap-0.5">
                <span className="text-base sm:text-lg font-semibold tracking-tight text-foreground data-mono truncate block">
                  {card.value}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">{card.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
