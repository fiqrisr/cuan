import { Skeleton } from '@cuan/ui';

const ROWS = 6;

export function TransactionListSkeleton() {
  return (
    <div aria-busy='true' aria-label='Loading transactions' className='flex flex-col divide-y divide-border'>
      {Array.from({ length: ROWS }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
        <div key={i} className='flex items-center gap-4 px-4 py-3'>
          <Skeleton className='h-4 w-14 shrink-0' />
          <div className='flex flex-col gap-1.5 flex-1'>
            <Skeleton className='h-4 w-2/5' />
            <Skeleton className='h-3 w-1/5' />
          </div>
          <Skeleton className='h-5 w-20 rounded-full' />
          <Skeleton className='h-4 w-24 ml-auto' />
        </div>
      ))}
    </div>
  );
}
