import { Skeleton } from '@cuan/ui';

const ROWS = 6;

export function TransactionListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col divide-y divide-border/10">
      {Array.from({ length: ROWS }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-2/5 max-w-[180px]" />
            <Skeleton className="h-3 w-1/4 max-w-[100px]" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full shrink-0" />
          <Skeleton className="h-4 w-24 ml-auto shrink-0" />
        </div>
      ))}
    </div>
  );
}
