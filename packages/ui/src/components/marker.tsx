import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/utils';

const markerVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1 label-caps rounded-[2px] w-fit transition-all',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-muted/10 text-[#8e928f]',
        success: 'border-transparent bg-primary/10 text-primary',
        destructive: 'border-transparent bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface MarkerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof markerVariants> {
  isLoading?: boolean;
}

const Marker = React.forwardRef<HTMLDivElement, MarkerProps>(
  ({ className, variant, isLoading, children, ...props }, ref) => (
    <div ref={ref} className={cn(markerVariants({ variant }), className)} {...props}>
      {isLoading && (
        <span className="flex h-3 w-3 items-center justify-center">
          <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
        </span>
      )}
      {children}
    </div>
  ),
);
Marker.displayName = 'Marker';

export { Marker, markerVariants };
