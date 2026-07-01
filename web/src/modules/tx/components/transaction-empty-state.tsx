import { ReceiptText } from 'lucide-react';

export function TransactionEmptyState() {
  return (
    <div
      role='status'
      className='flex flex-col items-center justify-center gap-3 py-16 text-center'
    >
      <ReceiptText size={40} className='text-muted-foreground' />
      <div className='flex flex-col gap-1'>
        <p className='font-semibold text-base'>No transactions</p>
        <p className='text-sm text-muted-foreground'>Use chat to log expenses and income.</p>
      </div>
    </div>
  );
}
