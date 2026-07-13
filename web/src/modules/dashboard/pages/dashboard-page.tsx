import { Skeleton } from '@cuan/ui';
import { useState } from 'react';
import { useGetAccountListQuery } from '@/modules/account/hooks/use-get-account-list-query';
import { useGetTransactionListQuery } from '@/modules/tx/hooks/use-get-transaction-list-query';
import { CategoryBreakdown } from '../components/category-breakdown';
import { RecentTransactions } from '../components/recent-transactions';
import { SpendingTrend } from '../components/spending-trend';
import { SummaryCards } from '../components/summary-cards';
import { useGetDashboardStatsQuery } from '../hooks/use-get-dashboard-stats-query';

export function DashboardPage() {
  const [range, setRange] = useState('30d');
  const [accountId, setAccountId] = useState('');

  const { data: accountsData, isLoading: accountsLoading } = useGetAccountListQuery();
  const accounts = accountsData?.data ?? [];

  const totalBalance = accountId
    ? Number(accounts.find(a => a.id === accountId)?.balance ?? 0)
    : accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const getDatesForRange = (selectedRange: string) => {
    const to = new Date();
    const from = new Date();

    if (selectedRange === '7d') {
      from.setDate(to.getDate() - 7);
    } else if (selectedRange === '30d') {
      from.setDate(to.getDate() - 30);
    } else if (selectedRange === 'this-month') {
      from.setDate(1);
    } else if (selectedRange === 'this-year') {
      from.setMonth(0, 1);
    }

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    return { from: formatDate(from), to: formatDate(to) };
  };

  const dates = getDatesForRange(range);

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErr,
  } = useGetDashboardStatsQuery({
    from: dates.from,
    to: dates.to,
    accountId: accountId || undefined,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useGetTransactionListQuery();
  const transactions = transactionsData?.data ?? [];

  const stats = statsData?.data;
  const isLoading = accountsLoading || statsLoading || transactionsLoading;

  if (statsError) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-8">
        <div
          role="alert"
          className="text-sm text-destructive bg-destructive/10 px-5 py-4 rounded-xl max-w-md w-full text-center border border-destructive/10"
        >
          {statsErr instanceof Error ? statsErr.message : 'Failed to load dashboard statistics.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="px-5 py-10 sm:px-8 lg:px-16 xl:px-20 max-w-[1440px] mx-auto w-full flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-3 border-b border-border/10">
          <div>
            <h1 className="display-lg-mobile lg:display-lg text-foreground">Dashboard</h1>
            <p className="body-lg text-muted-foreground mt-2 prose-short">
              A quick look at where your money sits, flows, and grows.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="h-10 px-0 py-1 bg-transparent border-0 border-b border-tertiary/30 text-sm font-medium focus:outline-none focus:border-primary text-foreground shrink-0 rounded-none cursor-pointer transition-colors duration-200"
            >
              <option value="" className="bg-card text-foreground">
                All Accounts
              </option>
              {accounts.map(a => (
                <option key={a.id} value={a.id} className="bg-card text-foreground">
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={range}
              onChange={e => setRange(e.target.value)}
              className="h-10 px-0 py-1 bg-transparent border-0 border-b border-tertiary/30 text-sm font-medium focus:outline-none focus:border-primary text-foreground shrink-0 rounded-none cursor-pointer transition-colors duration-200"
            >
              <option value="7d" className="bg-card text-foreground">
                Last 7 Days
              </option>
              <option value="30d" className="bg-card text-foreground">
                Last 30 Days
              </option>
              <option value="this-month" className="bg-card text-foreground">
                This Month
              </option>
              <option value="this-year" className="bg-card text-foreground">
                This Year
              </option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(id => (
                <div key={id} className="rounded-xl glass-panel p-6 flex flex-col gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-xl glass-panel p-6 flex flex-col gap-4 h-[320px]">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="flex-1 w-full" />
              </div>
              <div className="rounded-xl glass-panel p-6 flex flex-col gap-4 h-[320px]">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="flex-1 w-full" />
              </div>
            </div>
          </div>
        ) : stats ? (
          <>
            <SummaryCards
              totalBalance={totalBalance}
              totalIncome={stats.summary.totalIncome}
              totalExpense={stats.summary.totalExpense}
              netSavings={stats.summary.netSavings}
              savingsRate={stats.summary.savingsRate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SpendingTrend daily={stats.daily} />
              <CategoryBreakdown categories={stats.categories} />
            </div>

            <RecentTransactions transactions={transactions} />
          </>
        ) : null}
      </div>
    </div>
  );
}
