import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[2px] border px-2.5 py-0.5 label-caps transition-all focus:outline-none focus:ring-0',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary',
        secondary: 'border-transparent bg-secondary/10 text-secondary-foreground',
        muted: 'border-transparent bg-muted/10 text-muted-foreground',
        destructive: 'border-transparent bg-destructive/10 text-destructive',
        success: 'border-transparent bg-primary/10 text-primary',
        outline: 'border-border text-foreground bg-transparent',
      },
    },
    defaultVariants: { variant: 'muted' },
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
