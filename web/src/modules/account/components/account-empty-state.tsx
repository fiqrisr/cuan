import { Wallet } from 'lucide-react';

export function AccountEmptyState() {
  return (
    <div role='status' className='flex flex-col items-center justify-center py-16 gap-3 text-center'>
      <div className='p-4 bg-muted rounded-full text-muted-foreground'>
        <Wallet size={32} />
      </div>
      <h3 className='text-lg font-semibold text-foreground'>No accounts yet</h3>
      <p className='text-sm text-muted-foreground max-w-xs'>
        You don't have any financial accounts set up. Use the chat to create one.
      </p>
    </div>
  );
}
