import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold label-caps transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default: 'border-primary/25 bg-primary/15 text-primary hover:bg-primary/20',
        secondary: 'border-border/40 bg-secondary text-secondary-foreground hover:bg-secondary/80',
        muted: 'border-border/30 bg-muted text-muted-foreground hover:bg-muted/80',
        destructive:
          'border-destructive/25 bg-destructive/15 text-destructive hover:bg-destructive/20',
        success: 'border-primary/25 bg-primary/15 text-primary hover:bg-primary/20',
        outline: 'border-border text-foreground bg-transparent hover:bg-muted/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  ),
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
