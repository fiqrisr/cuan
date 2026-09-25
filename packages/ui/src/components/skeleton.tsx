import * as React from 'react';
import { cn } from '../lib/utils';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="status"
    aria-label="Loading..."
    className={cn('animate-pulse rounded-md bg-muted/60', className)}
    {...props}
  />
));
Skeleton.displayName = 'Skeleton';

export { Skeleton };
