import { ChevronLeft, ChevronRight } from 'lucide-react';
import type * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const navButton =
  'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 cursor-pointer';

/**
 * Themed react-day-picker. Styled exclusively with Tailwind + app tokens; the
 * library's stock stylesheet is intentionally not imported. Modifier classes
 * (selected, range_*, today…) land on the day `<td>`, so the inner button is
 * targeted with `[&>button]`.
 */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-1 select-none', className)}
      classNames={{
        root: 'w-fit',
        months: 'relative flex flex-col gap-5 sm:flex-row',
        month: 'flex flex-col gap-2',
        nav: 'absolute inset-x-0 top-0 z-10 flex items-center justify-between',
        button_previous: navButton,
        button_next: navButton,
        month_caption: 'flex h-7 items-center justify-center',
        caption_label: 'text-sm font-semibold tracking-tight text-foreground',
        month_grid: 'border-collapse',
        weekday:
          'size-9 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground',
        day: 'p-0 text-center text-sm',
        day_button:
          'inline-flex size-9 items-center justify-center rounded-md text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
        today:
          '[&:not([aria-selected])>button]:text-primary [&:not([aria-selected])>button]:font-semibold [&:not([aria-selected])>button]:bg-primary/10',
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:font-semibold',
        range_start: 'rounded-l-md bg-accent',
        range_end: 'rounded-r-md bg-accent',
        range_middle:
          'bg-accent [&>button]:bg-transparent! [&>button]:text-accent-foreground! [&>button]:rounded-none [&>button]:hover:bg-primary/20!',
        outside: 'opacity-40',
        disabled: 'pointer-events-none opacity-30',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('size-4', chevronClass)} />
          ) : (
            <ChevronRight className={cn('size-4', chevronClass)} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
