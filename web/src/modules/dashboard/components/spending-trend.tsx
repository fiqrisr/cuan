import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cuan/ui';
import { BarChart3, LineChart } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';

export type SpendingTrendFilter = 'all' | 'income' | 'expense';
export type SpendingTrendView = 'bars' | 'net';

type TrendTooltipProps = Partial<TooltipContentProps<number, string>>;

export type DailyItem = {
  date: string;
  income: number;
  expense: number;
};

export type SpendingTrendProps = {
  daily: DailyItem[];
  filter?: SpendingTrendFilter;
  onFilterChange?: (filter: SpendingTrendFilter) => void;
  view?: SpendingTrendView;
  onViewChange?: (view: SpendingTrendView) => void;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);
};

const formatCompact = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(val);
};

const formatDateLabel = (dateStr: string, locale = 'id-ID') => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
};

const formatFullDateLabel = (dateStr: string, locale = 'id-ID') => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
};

export function SpendingTrend({
  daily,
  filter: filterProp,
  onFilterChange,
  view: viewProp,
  onViewChange,
}: SpendingTrendProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'id-ID';

  const [uncontrolledFilter, setUncontrolledFilter] = useState<SpendingTrendFilter>('all');
  const activeFilter = filterProp ?? uncontrolledFilter;
  const handleFilterChange = (newFilter: SpendingTrendFilter) => {
    if (onFilterChange) {
      onFilterChange(newFilter);
    } else {
      setUncontrolledFilter(newFilter);
    }
  };

  const [uncontrolledView, setUncontrolledView] = useState<SpendingTrendView>('bars');
  const activeView = viewProp ?? uncontrolledView;
  const handleViewChange = (newView: SpendingTrendView) => {
    if (onViewChange) {
      onViewChange(newView);
    } else {
      setUncontrolledView(newView);
    }
  };

  const totalIncome = useMemo(() => daily.reduce((sum, d) => sum + d.income, 0), [daily]);
  const totalExpense = useMemo(() => daily.reduce((sum, d) => sum + d.expense, 0), [daily]);
  const netTotal = totalIncome - totalExpense;

  const dayCount = daily.length || 1;
  const avgIncome = totalIncome / dayCount;
  const avgExpense = totalExpense / dayCount;

  const peakIncomeDay = useMemo(
    () =>
      daily.reduce((max, d) => (d.income > max.income ? d : max), {
        date: '',
        income: 0,
        expense: 0,
      }),
    [daily],
  );

  const peakExpenseDay = useMemo(
    () =>
      daily.reduce((max, d) => (d.expense > max.expense ? d : max), {
        date: '',
        income: 0,
        expense: 0,
      }),
    [daily],
  );

  const data = useMemo(
    () =>
      daily.map(d => ({
        ...d,
        net: d.income - d.expense,
      })),
    [daily],
  );

  if (daily.length === 0) {
    return (
      <Card className="flex flex-col h-full min-h-[380px]">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('dashboard.spendingTrend')}</CardTitle>
          <CardDescription>{t('dashboard.incomeVsExpense')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-14 gap-2">
          <div className="p-3 rounded-full bg-muted/30">
            <BarChart3 size={22} strokeWidth={1.75} />
          </div>
          <p className="text-sm font-medium text-foreground">{t('common.noResults')}</p>
          <p className="text-xs text-muted-foreground">{t('common.retry')}</p>
        </CardContent>
      </Card>
    );
  }

  const hasNoDataForFilter =
    (activeFilter === 'income' && totalIncome === 0) ||
    (activeFilter === 'expense' && totalExpense === 0);

  // Tooltip component
  const CustomTooltip = ({ active, payload, label }: TrendTooltipProps) => {
    if (active && payload?.length) {
      const rawDate = label as string;
      const dateFormatted = formatFullDateLabel(rawDate, locale);
      const currentItem = payload[0]?.payload as (DailyItem & { net?: number }) | undefined;
      const inc = currentItem?.income ?? 0;
      const exp = currentItem?.expense ?? 0;
      const net = inc - exp;

      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-sm min-w-[210px] z-50">
          <p className="font-semibold text-foreground mb-2.5 pb-1.5 border-b border-border/30 text-xs">
            {dateFormatted}
          </p>
          <div className="flex flex-col gap-2">
            {payload.map((entry, index) => {
              const entryName = entry.name ?? '';
              return (
                <div key={entryName || index} className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color || entry.fill }}
                    />
                    <span className="text-muted-foreground text-xs capitalize">
                      {entryName === 'net' ? t('dashboard.netCashFlow') : entryName}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-xs text-foreground">
                    {formatCurrency(Number(entry.value))}
                  </span>
                </div>
              );
            })}

            {activeFilter === 'all' && activeView === 'bars' && payload.length > 1 && (
              <div className="pt-1.5 border-t border-border/20 flex justify-between items-center gap-4">
                <span className="text-muted-foreground text-xs">{t('dashboard.netCashFlow')}</span>
                <span
                  className={`font-mono font-medium text-xs ${
                    net >= 0 ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {net >= 0 ? `+${formatCurrency(net)}` : formatCurrency(net)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const descriptionText =
    activeFilter === 'all'
      ? activeView === 'bars'
        ? t('dashboard.incomeVsExpense')
        : t('dashboard.netThisMonth')
      : activeFilter === 'income'
        ? t('dashboard.incomeTrend')
        : t('dashboard.expenseTrend');

  return (
    <Card className="flex flex-col h-full min-h-[420px] relative">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <CardTitle className="text-base font-semibold">{t('dashboard.spendingTrend')}</CardTitle>
          <CardDescription className="mt-0.5 leading-snug">{descriptionText}</CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Filter Type Pills */}
          <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/10 shrink-0">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'shadow-xs bg-background text-foreground border border-border/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={activeFilter === 'all'}
            >
              {t('common.all')}
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('income')}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'income'
                  ? 'shadow-xs bg-primary/15 text-primary border border-primary/25 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={activeFilter === 'income'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {t('transactions.typeIncome')}
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('expense')}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'expense'
                  ? 'shadow-xs bg-destructive/15 text-destructive border border-destructive/25 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={activeFilter === 'expense'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
              {t('transactions.typeExpense')}
            </button>
          </div>

          {/* View Mode Toggle: Bars vs Trend */}
          <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/10 shrink-0">
            <button
              type="button"
              onClick={() => handleViewChange('bars')}
              aria-label={t('dashboard.barView')}
              title={t('dashboard.barView')}
              className={`h-7 w-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                activeView === 'bars'
                  ? 'shadow-xs bg-background text-foreground border border-border/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={activeView === 'bars'}
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('net')}
              aria-label={t('dashboard.areaView')}
              title={t('dashboard.areaView')}
              className={`h-7 w-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                activeView === 'net'
                  ? 'shadow-xs bg-background text-foreground border border-border/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={activeView === 'net'}
            >
              <LineChart className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between p-4 pt-2">
        {/* Quick summary KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-2 px-3 rounded-lg bg-muted/20 border border-border/15 mb-3 text-xs">
          {activeFilter === 'all' ? (
            <>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px] font-medium">
                  {t('transactions.typeIncome')}
                </span>
                <span className="font-semibold text-primary font-mono text-xs sm:text-sm mt-0.5">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px] font-medium">
                  {t('transactions.typeExpense')}
                </span>
                <span className="font-semibold text-destructive font-mono text-xs sm:text-sm mt-0.5">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
              <div className="flex flex-col col-span-2 sm:col-span-1">
                <span className="text-muted-foreground text-[11px] font-medium">
                  {t('dashboard.netCashFlow')}
                </span>
                <span
                  className={`font-semibold font-mono text-xs sm:text-sm mt-0.5 ${
                    netTotal >= 0 ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {netTotal >= 0 ? `+${formatCurrency(netTotal)}` : formatCurrency(netTotal)}
                </span>
              </div>
            </>
          ) : activeFilter === 'income' ? (
            <>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px] font-medium">
                  {t('dashboard.totalIncome')}
                </span>
                <span className="font-semibold text-primary font-mono text-xs sm:text-sm mt-0.5">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px] font-medium">
                  {t('dashboard.dailyAverage')}
                </span>
                <span className="font-semibold text-foreground font-mono text-xs sm:text-sm mt-0.5">
                  {formatCurrency(avgIncome)}
                </span>
              </div>
              <div className="flex flex-col col-span-2 sm:col-span-1">
                <span className="text-muted-foreground text-[11px] font-medium">
                  {t('dashboard.peakDay')}
                </span>
                <span className="font-semibold text-foreground font-mono text-xs sm:text-sm mt-0.5 truncate">
                  {peakIncomeDay.income > 0
                    ? `${formatCurrency(peakIncomeDay.income)} (${formatDateLabel(peakIncomeDay.date, locale)})`
                    : '-'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px] font-medium">
                  {t('dashboard.totalExpense')}
                </span>
                <span className="font-semibold text-destructive font-mono text-xs sm:text-sm mt-0.5">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px] font-medium">
                  {t('dashboard.dailyAverage')}
                </span>
                <span className="font-semibold text-foreground font-mono text-xs sm:text-sm mt-0.5">
                  {formatCurrency(avgExpense)}
                </span>
              </div>
              <div className="flex flex-col col-span-2 sm:col-span-1">
                <span className="text-muted-foreground text-[11px] font-medium">
                  {t('dashboard.peakDay')}
                </span>
                <span className="font-semibold text-foreground font-mono text-xs sm:text-sm mt-0.5 truncate">
                  {peakExpenseDay.expense > 0
                    ? `${formatCurrency(peakExpenseDay.expense)} (${formatDateLabel(peakExpenseDay.date, locale)})`
                    : '-'}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="w-full h-[270px]">
          {hasNoDataForFilter ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 border border-dashed border-border/40 rounded-lg p-6">
              <p className="text-sm font-medium text-foreground">
                {activeFilter === 'income'
                  ? t('dashboard.noIncomeInPeriod')
                  : t('dashboard.noExpenseInPeriod')}
              </p>
              <p className="text-xs text-muted-foreground">{t('dashboard.allTrend')}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs h-7"
                onClick={() => handleFilterChange('all')}
              >
                {t('dashboard.resetFilter')}
              </Button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {activeView === 'bars' ? (
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={d => formatDateLabel(d, locale)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    dy={10}
                    minTickGap={28}
                  />
                  <YAxis
                    tickFormatter={formatCompact}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  />

                  {(activeFilter === 'all' || activeFilter === 'income') && (
                    <Bar
                      dataKey="income"
                      name={t('transactions.typeIncome')}
                      fill="var(--primary)"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={activeFilter === 'all' ? 32 : 40}
                      animationDuration={600}
                    />
                  )}
                  {(activeFilter === 'all' || activeFilter === 'expense') && (
                    <Bar
                      dataKey="expense"
                      name={t('transactions.typeExpense')}
                      fill="var(--destructive)"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={activeFilter === 'all' ? 32 : 40}
                      animationDuration={600}
                    />
                  )}
                </BarChart>
              ) : (
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={d => formatDateLabel(d, locale)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    dy={10}
                    minTickGap={28}
                  />
                  <YAxis
                    tickFormatter={formatCompact}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {activeFilter === 'all' && (
                    <>
                      <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                      <Area
                        type="monotone"
                        dataKey="net"
                        name={t('dashboard.netCashFlow')}
                        stroke="var(--primary)"
                        fill="url(#colorNet)"
                        strokeWidth={2}
                        animationDuration={600}
                      />
                    </>
                  )}
                  {activeFilter === 'income' && (
                    <Area
                      type="monotone"
                      dataKey="income"
                      name={t('transactions.typeIncome')}
                      stroke="var(--primary)"
                      fill="url(#colorIncome)"
                      strokeWidth={2}
                      animationDuration={600}
                    />
                  )}
                  {activeFilter === 'expense' && (
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name={t('transactions.typeExpense')}
                      stroke="var(--destructive)"
                      fill="url(#colorExpense)"
                      strokeWidth={2}
                      animationDuration={600}
                    />
                  )}
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
