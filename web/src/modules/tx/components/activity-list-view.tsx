import type { Transaction } from '../types';
import { TransactionRow } from './transaction-row';

const getRelativeDateKey = (dateStr: string) => {
  const txDate = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const formattedDate = txDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (txDate.toDateString() === today.toDateString()) {
    return `Today, ${formattedDate}`;
  }
  if (txDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${formattedDate}`;
  }
  return txDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

type Props = {
  transactions: Transaction[];
};

export function ActivityListView({ transactions }: Props) {
  // Group transactions by date
  const grouped = transactions.reduce(
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
    <div className="flex flex-col gap-6" role="feed" aria-label="Transaction activity timeline">
      {groupedKeys.map(dateKey => {
        const groupItems = grouped[dateKey];
        return (
          <div key={dateKey} className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="label-caps text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {dateKey}
              </h3>
              <span className="text-[11px] text-muted-foreground font-medium">
                {groupItems.length} {groupItems.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden divide-y divide-border/60">
              {groupItems.map(tx => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
