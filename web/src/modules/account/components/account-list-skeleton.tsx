import { Skeleton } from '@cuan/ui';

export function AccountListSkeleton() {
  return (
    <div aria-busy='true' aria-label='Loading accounts' className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className='h-28 w-full rounded-2xl' />
      ))}
    </div>
  );
}
