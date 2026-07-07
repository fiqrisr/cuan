import { Badge, Card, CardContent, CardHeader, CardTitle } from '@cuan/ui';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react';

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="label-caps text-muted-foreground">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="headline-sm text-foreground tracking-tight font-semibold mt-2">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Current balance across accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="label-caps text-muted-foreground">Income</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="headline-sm text-primary tracking-tight font-semibold mt-2">
            {formatCurrency(totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total earnings in period</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="label-caps text-muted-foreground">Expenses</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="headline-sm text-destructive tracking-tight font-semibold mt-2">
            {formatCurrency(totalExpense)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total spending in period</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="label-caps text-muted-foreground">Savings</CardTitle>
          <PiggyBank className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="headline-sm text-primary tracking-tight font-semibold mt-2">
            {formatCurrency(netSavings)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="success">{savingsRate.toFixed(1)}%</Badge>
            <span className="text-xs text-muted-foreground">Savings rate</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
