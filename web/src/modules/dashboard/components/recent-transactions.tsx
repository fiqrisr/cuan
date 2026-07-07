import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@cuan/ui';
import { TransactionAmount } from '@/modules/tx/components/transaction-amount';
import type { Transaction } from '@/modules/tx/types';

type Props = {
  transactions: Transaction[];
};

export function RecentTransactions({ transactions }: Props) {
  const recent = transactions.slice(0, 5);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
        <CardDescription>Your latest financial activities</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pr-2">
        {recent.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12 text-sm">
            No transactions found
          </div>
        ) : (
          <Table>
            <TableBody>
              {recent.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground text-xs w-[65px] shrink-0">
                    {new Date(tx.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    <p className="font-medium text-sm truncate">{tx.description}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="muted">{tx.category || 'Uncategorized'}</Badge>
                  </TableCell>
                  <TableCell className="text-right shrink-0">
                    <TransactionAmount amount={tx.amount} type={tx.type} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
