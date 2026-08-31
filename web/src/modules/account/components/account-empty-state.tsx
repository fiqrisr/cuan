import { Link } from '@tanstack/react-router';
import { Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AccountEmptyState() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-16 gap-3 text-center"
    >
      <div className="p-4 rounded-2xl bg-muted/30 text-muted-foreground">
        <Wallet size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{t('accounts.emptyTitle')}</h3>
        <p className="text-sm text-muted-foreground mt-1 prose-short">{t('accounts.emptyBody')}</p>
      </div>
      <Link
        to="/chat"
        className="mt-1 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
      >
        {t('accounts.addAccount')}
      </Link>
    </div>
  );
}
