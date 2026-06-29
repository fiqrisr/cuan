import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@cuan/ui';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

export function TransactionsModule() {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await api.api.transactions.get({ query: { limit: 50, page: 1 } });
      if (res.error) throw res.error;
      return res.data;
    },
  });

  return (
    <div className="flex flex-col flex-1 p-4">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Desc</TableHead>
              <TableHead>Cat</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              data?.transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    {tx.description}
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-body-strong">
                      {tx.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {tx.type === 'income' ? (
                        <ArrowUpIcon size={14} className="text-success" />
                      ) : (
                        <ArrowDownIcon size={14} className="text-destructive" />
                      )}
                      <span
                        className={
                          tx.type === 'income'
                            ? 'text-success font-semibold'
                            : 'text-body-strong font-semibold'
                        }
                      >
                        ${tx.amount}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
