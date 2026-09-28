import { Card, CardContent, CardHeader, CardTitle } from '@cuan/ui';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SpendingTrendFilter } from './spending-trend';

type Props = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  activeFilter?: SpendingTrendFilter;
  onFilterChange?: (filter: SpendingTrendFilter) => void;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);
};

export function SummaryCards({
  totalBalance,
  totalIncome,
  totalExpense,
  netSavings,
  savingsRate,
  activeFilter = 'all',
  onFilterChange,
}: Props) {
  const { t } = useTranslation();

  const items = [
    {
      id: 'balance' as const,
      title: t('dashboard.totalBalance'),
      value: formatCurrency(totalBalance),
      hint: t('accounts.subtitle'),
      icon: Wallet,
      tone: 'default' as const,
      filterTarget: 'all' as SpendingTrendFilter,
      isFilterable: false,
    },
    {
      id: 'income' as const,
      title: t('dashboard.monthlyIncome'),
      value: formatCurrency(totalIncome),
      hint: t('dashboard.incomeVsExpense'),
      icon: ArrowDownRight,
      tone: 'primary' as const,
      filterTarget: 'income' as SpendingTrendFilter,
      isFilterable: true,
    },
    {
      id: 'expense' as const,
      title: t('dashboard.monthlyExpense'),
      value: formatCurrency(totalExpense),
      hint: t('dashboard.spendingTrend'),
      icon: ArrowUpRight,
      tone: 'destructive' as const,
      filterTarget: 'expense' as SpendingTrendFilter,
      isFilterable: true,
    },
    {
      id: 'net' as const,
      title: t('dashboard.netThisMonth'),
      value: formatCurrency(netSavings),
      hint: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      tone: 'primary' as const,
      filterTarget: 'all' as SpendingTrendFilter,
      isFilterable: false,
    },
  ];

  const handleCardClick = (target: SpendingTrendFilter, isFilterable: boolean) => {
    if (!onFilterChange) return;
    if (!isFilterable) {
      if (activeFilter !== 'all') {
        onFilterChange('all');
      }
      return;
    }
    if (activeFilter === target) {
      onFilterChange('all');
    } else {
      onFilterChange(target);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map(({ id, title, value, hint, icon: Icon, tone, filterTarget, isFilterable }) => {
        const isActive = isFilterable && activeFilter !== 'all' && activeFilter === filterTarget;
        const valueColor =
          tone === 'primary'
            ? 'text-primary'
            : tone === 'destructive'
              ? 'text-destructive'
              : 'text-foreground';
        const badgeStyle =
          tone === 'primary'
            ? 'bg-primary/12 text-primary border border-primary/25'
            : tone === 'destructive'
              ? 'bg-destructive/12 text-destructive border border-destructive/25'
              : 'bg-muted text-muted-foreground border border-border';

        const activeCardStyle = isActive
          ? tone === 'destructive'
            ? 'ring-2 ring-destructive/40 border-destructive/60 bg-destructive/[0.03] shadow-sm'
            : 'ring-2 ring-primary/40 border-primary/60 bg-primary/[0.03] shadow-sm'
          : '';

        return (
          <button
            key={id}
            type="button"
            onClick={() => handleCardClick(filterTarget, isFilterable)}
            disabled={!onFilterChange}
            aria-pressed={isActive}
            className={`text-left w-full h-full block rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              onFilterChange ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <Card
              className={`group relative h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md ${activeCardStyle}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-2 min-w-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground tracking-wide uppercase truncate">
                    {title}
                  </CardTitle>
                  {isActive && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 shrink-0">
                      {t('dashboard.filterActive')}
                    </span>
                  )}
                </div>
                <div
                  className={`p-2 rounded-lg ${badgeStyle} transition-transform group-hover:scale-105 shrink-0`}
                >
                  <Icon size={16} strokeWidth={2} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`headline-sm ${valueColor} font-semibold mt-1 data-mono`}>
                  {value}
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed flex items-center justify-between gap-1">
                  <span>{hint}</span>
                  {onFilterChange && isFilterable && (
                    <span className="text-[10px] text-muted-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isActive ? t('dashboard.clickToClearFilter') : t('dashboard.clickToFilter')}
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
