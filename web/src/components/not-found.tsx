import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl glass-panel border-primary/20 text-primary">
        <span className="font-serif text-3xl font-semibold">?</span>
      </div>
      <h1 className="headline-md text-foreground">{t('common.noResults')}</h1>
      <p className="body-md text-muted-foreground mt-2 prose-short">{t('common.error')}</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
      >
        {t('common.back')}
      </Link>
    </div>
  );
}
