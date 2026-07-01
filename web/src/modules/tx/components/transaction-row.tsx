import { Badge, TableCell, TableRow } from '@cuan/ui';
import type { Transaction } from '../types';
import { TransactionAmount } from './transaction-amount';

type Props = {
  transaction: Transaction;
};

export function TransactionRow({ transaction: tx }: Props) {
  return (
    <TableRow>
      <TableCell className='text-muted-foreground text-sm w-[72px] shrink-0'>
        {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
      </TableCell>
      <TableCell>
        <p className='font-medium text-sm'>{tx.description}</p>
        {tx.accountId && (
          <p className='text-xs text-muted-foreground mt-0.5'>{tx.accountId}</p>
        )}
      </TableCell>
      <TableCell>
        <Badge variant='muted'>{tx.category || 'Uncategorized'}</Badge>
      </TableCell>
      <TableCell className='text-right'>
        <TransactionAmount amount={tx.amount} type={tx.type} />
      </TableCell>
    </TableRow>
  );
}
