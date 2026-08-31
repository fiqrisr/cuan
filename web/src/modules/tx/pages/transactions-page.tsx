import { Button, Input } from '@cuan/ui';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useGetAccountListQuery } from '@/modules/account/hooks/use-get-account-list-query';
import { CreateTransactionForm } from '../components/create-transaction-form';
import { TransactionEmptyState } from '../components/transaction-empty-state';
import { TransactionListSkeleton } from '../components/transaction-list-skeleton';
import { TransactionRow } from '../components/transaction-row';
import { useGetTransactionListQuery } from '../hooks/use-get-transaction-list-query';
import type { Transaction } from '../types';

const getRelativeDateKey = (dateStr: string) => {
  const txDate = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const formattedDate = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (txDate.toDateString() === today.toDateString()) {
    return `Today, ${formattedDate}`;
  }
  if (txDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${formattedDate}`;
  }
  return txDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

export function TransactionsPage({ accountId }: { accountId?: string }) {
  const { data, isLoading, isError, error } = useGetTransactionListQuery({ accountId });
  const { data: accountsData } = useGetAccountListQuery();

  const account = accountsData?.data.find(a => a.id === accountId);
  const title = account ? `${account.name} History` : 'History';
  const description = account
    ? `Review income and expenses for ${account.name}`
    : 'Review all your processed income and expenses';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCreating, setIsCreating] = useState(false);

  const transactions = data?.data ?? [];

  // Extract unique categories dynamically
  const categories = [
    'All',
    ...Array.from(new Set(transactions.map(t => t.category).filter(Boolean) as string[])),
  ];

  // Filter transactions based on category and search query
  const filteredTransactions = transactions.filter(tx => {
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group filtered transactions by date
  const grouped = filteredTransactions.reduce(
    (acc, tx) => {
      const key = getRelativeDateKey(tx.date);
      if (!acc[key]) acc[key] = [];
      acc[key].push(tx);
      return acc;
    },
    {} as Record<string, Transaction[]>,
  );

  const groupedKeys = Object.keys(grouped);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="px-5 pt-10 pb-28 lg:pb-10 sm:px-8 lg:px-16 xl:px-20 max-w-360 mx-auto w-full flex flex-col gap-8">
        {/* Header & Search */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-border/10">
            <div>
              <h1 className="display-lg-mobile lg:headline-md text-foreground">{title}</h1>
              <p className="body-md text-muted-foreground mt-2 prose-short">{description}</p>
            </div>
            <Button onClick={() => setIsCreating(true)} disabled={isCreating || isLoading}>
              + Add Transaction
            </Button>
          </div>

          {isCreating && (
            <CreateTransactionForm
              onSuccess={() => setIsCreating(false)}
              onCancel={() => setIsCreating(false)}
              defaultAccountId={accountId}
            />
          )}

          {/* Search Input */}
          <div className="relative w-full mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="pl-10 w-full h-11"
            />
          </div>
        </div>

        {/* Filter Chips */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(category => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-tint'
                      : 'bg-muted/40 text-muted-foreground border border-border/10 hover:bg-muted/60'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg glass-panel overflow-hidden">
            <TransactionListSkeleton />
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="rounded border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error instanceof Error ? error.message : 'Failed to load transactions.'}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <TransactionEmptyState />
        ) : (
          <div className="flex flex-col gap-6">
            {groupedKeys.map(dateKey => (
              <div key={dateKey} className="flex flex-col gap-3">
                <h3 className="label-caps text-muted-foreground mt-2">{dateKey}</h3>
                <div className="flex flex-col">
                  {grouped[dateKey].map(tx => (
                    <TransactionRow key={tx.id} transaction={tx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
