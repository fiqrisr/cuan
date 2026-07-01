import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@cuan/ui';
import { useGetTransactionListQuery } from '../hooks/use-get-transaction-list-query';
import { TransactionEmptyState } from '../components/transaction-empty-state';
import { TransactionListSkeleton } from '../components/transaction-list-skeleton';
import { TransactionRow } from '../components/transaction-row';

export function TransactionsPage() {
  const { data, isLoading, isError, error } = useGetTransactionListQuery();

  const transactions = data?.data ?? [];

  return (
    <div className='flex flex-col flex-1 min-h-0 overflow-y-auto'>
      <div className='p-4 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6'>
        <h1 className='text-2xl font-semibold tracking-tight'>History</h1>

        {isLoading ? (
          <div className='rounded-xl border bg-card overflow-hidden'>
            <TransactionListSkeleton />
          </div>
        ) : isError ? (
          <div role='alert' className='rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
            {error instanceof Error ? error.message : 'Failed to load transactions.'}
          </div>
        ) : transactions.length === 0 ? (
          <TransactionEmptyState />
        ) : (
          <div className='rounded-xl border bg-card overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[72px]'>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className='text-right'>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
