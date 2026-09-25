import { telemetry } from './telemetry';

export function setupGlobalErrorListeners(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleError = (event: ErrorEvent) => {
    telemetry.captureException(event.error ?? new Error(event.message), {
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(
            typeof event.reason === 'string' ? event.reason : 'Unhandled Promise Rejection',
          );

    telemetry.captureException(error, {
      metadata: {
        type: 'unhandledrejection',
      },
    });
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}
