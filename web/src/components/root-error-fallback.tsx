import type { ErrorComponentProps } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { telemetry } from '@/core/telemetry';

export function RootErrorFallback({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation();

  const errorMessage = error instanceof Error ? error.message : String(error ?? '');
  const isChunkError =
    /failed to fetch dynamically imported module|importing a module script failed/i.test(
      errorMessage,
    );

  useEffect(() => {
    telemetry.captureException(error, {
      metadata: {
        isChunkError,
        errorMessage,
      },
    });

    if (isChunkError && typeof window !== 'undefined') {
      const reloaded = sessionStorage.getItem('cuan_chunk_reload');
      if (!reloaded) {
        sessionStorage.setItem('cuan_chunk_reload', 'true');
        telemetry.recordEvent('stale_chunk_auto_reload', { message: errorMessage }, 'warn');
        window.location.reload();
      }
    }
  }, [error, isChunkError, errorMessage]);

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cuan_chunk_reload');
      window.location.reload();
    } else if (reset) {
      reset();
    }
  };

  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center p-6 text-center min-h-[50vh]"
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl glass-panel border-destructive/20 text-destructive">
        <AlertCircle className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="headline-md text-foreground">
        {isChunkError
          ? t('common.updateAvailable', 'App Updated')
          : t('common.error', 'Something went wrong')}
      </h1>
      <p className="body-md text-muted-foreground mt-2 max-w-md">
        {isChunkError
          ? t(
              'common.updateDescription',
              'A new version of the app has been deployed. Please reload to continue.',
            )
          : t(
              'common.errorDescription',
              'An unexpected error occurred. Our team has been notified via telemetry.',
            )}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleReload}
          className="inline-flex items-center gap-2 justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('common.reload', 'Reload')}
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
        >
          {t('common.back', 'Dashboard')}
        </Link>
      </div>
    </div>
  );
}
