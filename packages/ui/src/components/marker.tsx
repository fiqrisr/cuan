import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const markerVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md w-fit',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        success: 'bg-success/10 text-success',
        destructive: 'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface MarkerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof markerVariants> {
  isLoading?: boolean;
}

const Marker = React.forwardRef<HTMLDivElement, MarkerProps>(
  ({ className, variant, isLoading, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(markerVariants({ variant }), className)}
      {...props}
    >
      {isLoading && (
        <span className="flex h-3 w-3 items-center justify-center">
          <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
        </span>
      )}
      {children}
    </div>
  )
);
Marker.displayName = 'Marker';

export { Marker, markerVariants };
