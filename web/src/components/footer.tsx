import { useTranslation } from 'react-i18next';
import { PRIVACY_URL, TERMS_URL } from '@/core/config';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="hidden lg:block shrink-0 border-t border-border/10 bg-background/50 backdrop-blur-md px-6 py-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Cuan</span>
        <div className="flex items-center gap-4">
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            {t('common.privacy')}
          </a>
          <a
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            {t('common.terms')}
          </a>
        </div>
      </div>
    </footer>
  );
}
