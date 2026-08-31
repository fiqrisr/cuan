import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cuan/ui';
import { BarChart3, LineChart } from 'lucide-react';
import { useState } from 'react';
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

type TrendTooltipProps = Partial<TooltipContentProps<number, string>>;

type DailyItem = {
  date: string;
  income: number;
  expense: number;
};

type Props = {
  daily: DailyItem[];
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

const formatDateLabel = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
};

export function SpendingTrend({ daily }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'bars' | 'net'>('bars');

  if (daily.length === 0) {
    return (
      <Card className="flex flex-col h-full min-h-[350px]">
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

  const data = daily.map(d => ({
    ...d,
    net: d.income - d.expense,
  }));

  // Tooltip component
  const CustomTooltip = ({ active, payload, label }: TrendTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border/10 p-3 rounded-lg shadow-tint text-sm min-w-[200px]">
          <p className="font-semibold text-foreground mb-3">{formatDateLabel(label as string)}</p>
          <div className="flex flex-col gap-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  <span className="text-muted-foreground capitalize">
                    {entry.name === 'net' ? 'Net Cash Flow' : entry.name}
                  </span>
                </div>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(Number(entry.value))}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col h-full min-h-[380px] relative">
      <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between pb-2 gap-4">
        <div>
          <CardTitle className="text-base font-semibold">{t('dashboard.spendingTrend')}</CardTitle>
          <CardDescription className="mt-0.5 leading-snug">
            {t('dashboard.incomeVsExpense')}
          </CardDescription>
        </div>
        <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/10 shrink-0 self-start lg:self-auto overflow-x-auto max-w-full">
          <Button
            variant={activeTab === 'bars' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('bars')}
            className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all gap-1.5 ${
              activeTab === 'bars'
                ? 'shadow-sm bg-background border border-border/5'
                : 'text-muted-foreground'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {t('dashboard.incomeVsExpense')}
          </Button>
          <Button
            variant={activeTab === 'net' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('net')}
            className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all gap-1.5 ${
              activeTab === 'net'
                ? 'shadow-sm bg-background border border-border/5'
                : 'text-muted-foreground'
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            {t('dashboard.netThisMonth')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between p-4 pt-4">
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'bars' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  tickFormatter={formatCompact}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)' }} />

                <Bar
                  dataKey="income"
                  name={t('transactions.typeIncome')}
                  fill="var(--primary)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={40}
                  animationDuration={1000}
                />
                <Bar
                  dataKey="expense"
                  name={t('transactions.typeExpense')}
                  fill="var(--destructive)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={40}
                  animationDuration={1000}
                />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  tickFormatter={formatCompact}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="net"
                  stroke="var(--primary)"
                  fill="url(#colorNet)"
                  strokeWidth={2}
                  animationDuration={1000}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
