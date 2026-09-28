import { Bot, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ChatHeaderProps = {
  isLoading: boolean;
  onClear?: () => void;
  hasMessages?: boolean;
};

export function ChatHeader({ isLoading, onClear, hasMessages }: ChatHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-workspace/80 backdrop-blur-lg sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 text-primary shadow-sm">
          <Bot size={18} strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground leading-none">Cuan</h1>
          <p className="text-[11px] font-medium text-muted-foreground mt-1">
            {isLoading ? t('chat.thinking') : t('chat.subtitle')}
          </p>
        </div>
      </div>
      {hasMessages && onClear && (
        <button
          type="button"
          onClick={onClear}
          disabled={isLoading}
          aria-label={t('chat.clear', 'Clear conversation')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">{t('chat.clear', 'Clear')}</span>
        </button>
      )}
    </header>
  );
}
