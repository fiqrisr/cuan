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

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      from: formatDate(from),
      to: formatDate(to),
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
      <div className="px-5 py-12 sm:px-16 max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-border/10">
          <div>
            <h1 className="headline-md text-foreground tracking-tight">Dashboard</h1>
            <p className="body-md text-muted-foreground mt-1">Monitor and manage your finances</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Account Selector */}
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="h-9 px-0 py-1 bg-transparent border-0 border-b border-tertiary/30 text-sm font-semibold focus:outline-none focus:border-primary text-foreground shrink-0 rounded-none cursor-pointer transition-colors duration-200"
            >
              <option value="" className="bg-[#1e201f] text-foreground">
                All Accounts
              </option>
              {accounts.map(a => (
                <option key={a.id} value={a.id} className="bg-[#1e201f] text-foreground">
                  {a.name}
                </option>
              ))}
            </select>

            {/* Timeframe Selector */}
            <select
              value={range}
              onChange={e => setRange(e.target.value)}
              className="h-9 px-0 py-1 bg-transparent border-0 border-b border-tertiary/30 text-sm font-semibold focus:outline-none focus:border-primary text-foreground shrink-0 rounded-none cursor-pointer transition-colors duration-200"
            >
              <option value="7d" className="bg-[#1e201f] text-foreground">
                Last 7 Days
              </option>
              <option value="30d" className="bg-[#1e201f] text-foreground">
                Last 30 Days
              </option>
              <option value="this-month" className="bg-[#1e201f] text-foreground">
                This Month
              </option>
              <option value="this-year" className="bg-[#1e201f] text-foreground">
                This Year
              </option>
            </select>
          </div>
        </div>

        {isLoading ? (
          // Loading Skeletons
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(id => (
                <div key={id} className="rounded-lg glass-panel p-6 flex flex-col gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg glass-panel p-6 flex flex-col gap-4 h-[300px]">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="flex-1 w-full" />
              </div>
              <div className="rounded-lg glass-panel p-6 flex flex-col gap-4 h-[300px]">
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
            <div className="grid grid-cols-1 gap-6">
              <RecentTransactions transactions={transactions} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
