import { Link } from '@tanstack/react-router';
import { ReceiptText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TransactionEmptyState() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <div className="p-4 rounded-2xl bg-muted/30 text-muted-foreground">
        <ReceiptText size={32} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-base text-foreground">{t('transactions.emptyTitle')}</p>
        <p className="text-sm text-muted-foreground prose-short">{t('transactions.emptyBody')}</p>
      </div>
      <Link
        to="/chat"
        className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
      >
        {t('nav.assistant')}
      </Link>
    </div>
  );
}
