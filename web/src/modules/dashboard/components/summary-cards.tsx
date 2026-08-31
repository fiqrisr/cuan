import { Card, CardContent, CardHeader, CardTitle } from '@cuan/ui';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
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
}: Props) {
  const { t } = useTranslation();
  const items = [
    {
      title: t('dashboard.totalBalance'),
      value: formatCurrency(totalBalance),
      hint: t('accounts.subtitle'),
      icon: Wallet,
      tone: 'default' as const,
    },
    {
      title: t('dashboard.monthlyIncome'),
      value: formatCurrency(totalIncome),
      hint: t('dashboard.incomeVsExpense'),
      icon: ArrowDownRight,
      tone: 'primary' as const,
    },
    {
      title: t('dashboard.monthlyExpense'),
      value: formatCurrency(totalExpense),
      hint: t('dashboard.spendingTrend'),
      icon: ArrowUpRight,
      tone: 'destructive' as const,
    },
    {
      title: t('dashboard.netThisMonth'),
      value: formatCurrency(netSavings),
      hint: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      tone: 'primary' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map(({ title, value, hint, icon: Icon, tone }) => {
        const valueColor =
          tone === 'primary'
            ? 'text-primary'
            : tone === 'destructive'
              ? 'text-destructive'
              : 'text-foreground';
        const iconColor =
          tone === 'primary'
            ? 'text-primary'
            : tone === 'destructive'
              ? 'text-destructive'
              : 'text-muted-foreground';

        return (
          <Card
            key={title}
            className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-tint"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
              <div className={`p-1.5 rounded-md bg-muted/30 ${iconColor}`}>
                <Icon size={16} strokeWidth={1.75} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`headline-sm ${valueColor} font-semibold mt-1 data-mono`}>
                {value}
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
