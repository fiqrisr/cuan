import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cuan/ui';
import { Link } from '@tanstack/react-router';
import { ReceiptText } from 'lucide-react';
import { TransactionAmount } from '@/modules/tx/components/transaction-amount';
import type { Transaction } from '@/modules/tx/types';

type Props = {
  transactions: Transaction[];
};

export function RecentTransactions({ transactions }: Props) {
  const recent = transactions.slice(0, 5);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent transactions</CardTitle>
        <CardDescription>Your latest financial activities</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-5">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground py-14 gap-3">
            <div className="p-3 rounded-full bg-muted/30">
              <ReceiptText size={24} strokeWidth={1.75} />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm text-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask the assistant to log your first expense.
              </p>
            </div>
          </div>
        ) : (
          <ul role="list" className="flex flex-col gap-2">
            {recent.map(tx => (
              <li
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors border border-border/5 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="text-muted-foreground text-xs shrink-0 data-mono w-12 text-center leading-tight">
                    <span className="block font-semibold text-foreground text-sm">
                      {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric' })}
                    </span>
                    {new Date(tx.date).toLocaleDateString('id-ID', { month: 'short' })}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{tx.description}</p>
                    <div className="flex items-center">
                      <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                        {tx.category || 'Uncategorized'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <TransactionAmount amount={tx.amount} type={tx.type} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {recent.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/10 flex justify-end">
            <Link
              to="/transactions"
              className="text-xs font-medium text-primary hover:underline underline-offset-4 transition-colors"
            >
              View all transactions
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
