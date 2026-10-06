import { Button } from '@cuan/ui';
import { Link } from '@tanstack/react-router';
import { FilterX, Plus, ReceiptText, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onAddTransaction?: () => void;
};

export function TransactionEmptyState({
  isFiltered = false,
  onResetFilters,
  onAddTransaction,
}: Props) {
  const { t } = useTranslation();

  if (isFiltered) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center rounded-2xl bg-card border border-border shadow-xs"
      >
        <div className="p-4 rounded-2xl bg-muted/50 text-muted-foreground">
          <FilterX size={32} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <p className="font-semibold text-base text-foreground">
            {t('transactions.noFilterMatchesTitle', 'No matching transactions')}
          </p>
          <p className="text-sm text-muted-foreground prose-short">
            {t(
              'transactions.noFilterMatchesBody',
              'No records match your selected filters or search query. Try relaxing or resetting your filters.',
            )}
          </p>
        </div>
        {onResetFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="mt-2 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw size={14} />
            <span>{t('transactions.resetAllFilters', 'Clear All Filters')}</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center rounded-2xl bg-card border border-border shadow-xs"
    >
      <div className="p-4 rounded-2xl bg-primary/10 text-primary">
        <ReceiptText size={32} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1 max-w-sm">
        <p className="font-semibold text-base text-foreground">{t('transactions.emptyTitle')}</p>
        <p className="text-sm text-muted-foreground prose-short">{t('transactions.emptyBody')}</p>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {onAddTransaction && (
          <Button
            type="button"
            onClick={onAddTransaction}
            size="sm"
            className="inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>{t('transactions.addTransaction')}</span>
          </Button>
        )}
        <Link
          to="/chat"
          className="inline-flex items-center justify-center rounded-md bg-muted px-4 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted/80 active:scale-[0.98]"
        >
          {t('nav.assistant')}
        </Link>
      </div>
    </div>
  );
}
