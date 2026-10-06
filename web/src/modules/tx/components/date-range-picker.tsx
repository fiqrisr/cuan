import { Calendar, Popover, PopoverContent, PopoverTrigger } from '@cuan/ui';
import { differenceInCalendarDays, endOfDay, format, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';

type Props = {
  /** Committed custom range (ISO). Leave undefined when no custom range is active. */
  from?: string;
  to?: string;
  /** Fires once per completed range (or with `undefined` on clear) — never on the first click. */
  onSelectRange: (range: { from: string; to: string } | undefined) => void;
  placeholder?: string;
  numberOfMonths?: number;
  className?: string;
};

const formatDay = (date: Date) => format(date, 'MMM d, yyyy');

export function DateRangePicker({
  from,
  to,
  onSelectRange,
  placeholder,
  numberOfMonths = 2,
  className,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  // Local draft: selection in progress never leaves this component until complete.
  const [draft, setDraft] = React.useState<DateRange | undefined>();
  const [picking, setPicking] = React.useState(false);

  const committed = React.useMemo<DateRange | undefined>(
    () => (from && to ? { from: new Date(from), to: new Date(to) } : undefined),
    [from, to],
  );

  const visualRange = React.useMemo<DateRange | undefined>(() => {
    if (!draft?.from) return undefined;
    if (!draft.to) return { from: draft.from, to: undefined };
    const [first, last] = draft.from <= draft.to ? [draft.from, draft.to] : [draft.to, draft.from];
    return { from: first, to: last };
  }, [draft]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setDraft(committed);
      setPicking(false);
    }
  };

  const commit = (start: Date, end: Date) => {
    const [first, last] = start <= end ? [start, end] : [end, start];
    onSelectRange({
      from: startOfDay(first).toISOString(),
      to: endOfDay(last).toISOString(),
    });
    setOpen(false);
  };

  const handleDayClick = (day: Date) => {
    if (!picking || !draft?.from) {
      // First click: only remember the start. No request is made.
      setDraft({ from: day, to: undefined });
      setPicking(true);
      return;
    }
    commit(draft.from, day);
  };

  const handleDayMouseEnter = (day: Date) => {
    if (!picking || !draft?.from) return;
    setDraft({ from: draft.from, to: day });
  };

  const handleClear = () => {
    onSelectRange(undefined);
    setOpen(false);
  };

  const isActive = Boolean(committed);
  const label = committed?.from
    ? `${formatDay(committed.from)} – ${committed.to ? formatDay(committed.to) : ''}`
    : (placeholder ?? t('transactions.pickDateRange', 'Custom range'));

  const hint = picking
    ? t('transactions.datePickerPickEnd', 'Now pick the end date')
    : committed?.from && committed.to
      ? t('transactions.datePickerDays', '{{count}} days', {
          count: differenceInCalendarDays(committed.to, committed.from) + 1,
        })
      : t('transactions.datePickerPickStart', 'Pick the start date');

  return (
    <div className={`relative inline-flex items-center ${className ?? ''}`}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-3 text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border ${
              isActive
                ? 'bg-primary text-primary-foreground font-semibold border-primary shadow-xs pr-8'
                : 'border-border bg-muted/60 pr-3 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <CalendarIcon size={13} className="shrink-0" />
            <span>{label}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="p-3">
          <Calendar
            mode="range"
            numberOfMonths={numberOfMonths}
            selected={visualRange}
            onSelect={() => {}}
            onDayClick={handleDayClick}
            onDayMouseEnter={handleDayMouseEnter}
            onDayFocus={handleDayMouseEnter}
          />
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">{hint}</span>
            {isActive && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                {t('common.clear', 'Clear')}
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {isActive && (
        <button
          type="button"
          onClick={handleClear}
          aria-label={t('transactions.clearDateRange', 'Clear date range')}
          className="absolute right-1.5 flex size-5 items-center justify-center rounded-full text-primary-foreground/75 transition-colors hover:bg-primary-foreground/20 hover:text-primary-foreground cursor-pointer"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
