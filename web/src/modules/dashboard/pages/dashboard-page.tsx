import { useState } from 'react';
import { useGetDashboardStatsQuery } from '../hooks/use-get-dashboard-stats-query';
import { useGetAccountListQuery } from '@/modules/account/hooks/use-get-account-list-query';
import { useGetTransactionListQuery } from '@/modules/tx/hooks/use-get-transaction-list-query';
import { SummaryCards } from '../components/summary-cards';
import { CategoryBreakdown } from '../components/category-breakdown';
import { SpendingTrend } from '../components/spending-trend';
import { RecentTransactions } from '../components/recent-transactions';
import { Skeleton } from '@cuan/ui';

export function DashboardPage() {
  const [range, setRange] = useState('30d');
  const [accountId, setAccountId] = useState('');

  // 1. Fetch Accounts to populate Account Filter and calculate total balance
  const { data: accountsData, isLoading: accountsLoading } = useGetAccountListQuery();
  const accounts = accountsData?.data ?? [];

  // Calculate total balance from all accounts, or from the selected account
  const totalBalance = accountId
    ? Number(accounts.find(a => a.id === accountId)?.balance ?? 0)
    : accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  // 2. Calculate Date Range
  const getDatesForRange = (selectedRange: string) => {
    const to = new Date();
    const from = new Date();

    if (selectedRange === '7d') {
      from.setDate(to.getDate() - 7);
    } else if (selectedRange === '30d') {
      from.setDate(to.getDate() - 30);
    } else if (selectedRange === 'this-month') {
      from.setDate(1); // first day of month
    } else if (selectedRange === 'this-year') {
      from.setMonth(0, 1); // Jan 1st
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  };

  const dates = getDatesForRange(range);

  // 3. Fetch Dashboard Stats
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

  // 4. Fetch Transaction List for Recent Transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useGetTransactionListQuery();
  const transactions = transactionsData?.data ?? [];

  const stats = statsData?.data;

  const isLoading = accountsLoading || statsLoading || transactionsLoading;

  if (statsError) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-8">
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg max-w-md w-full text-center">
          {statsErr instanceof Error ? statsErr.message : 'Failed to load dashboard statistics.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-4 lg:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitor and manage your finances</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Account Selector */}
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="h-9 px-3 py-1 bg-background border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
            >
              <option value="">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Timeframe Selector */}
            <select
              value={range}
              onChange={e => setRange(e.target.value)}
              className="h-9 px-3 py-1 bg-background border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this-month">This Month</option>
              <option value="this-year">This Year</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          // Loading Skeletons
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(id => (
                <div
                  key={id}
                  className="border border-border/50 rounded-xl p-6 bg-card flex flex-col gap-3"
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-border/50 rounded-xl p-6 bg-card flex flex-col gap-4 h-[300px]">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="flex-1 w-full" />
              </div>
              <div className="border border-border/50 rounded-xl p-6 bg-card flex flex-col gap-4 h-[300px]">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="flex-1 w-full" />
              </div>
            </div>
          </div>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <SummaryCards
              totalBalance={totalBalance}
              totalIncome={stats.summary.totalIncome}
              totalExpense={stats.summary.totalExpense}
              netSavings={stats.summary.netSavings}
              savingsRate={stats.summary.savingsRate}
            />

            {/* Visual Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendingTrend daily={stats.daily} />
              <CategoryBreakdown categories={stats.categories} />
            </div>

            {/* Bottom widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentTransactions transactions={transactions} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
