import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { sanitizeTelemetryData, telemetry } from '../telemetry';

function getSafeKey(key: unknown): string {
  if (Array.isArray(key) && typeof key[0] === 'string') {
    return key[0];
  }
  return typeof key === 'string' ? key : 'unknown';
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const keyName = getSafeKey(query.queryKey);
      telemetry.addBreadcrumb({
        category: 'query',
        message: `Query failed: ${keyName}`,
        level: 'warn',
        data: {
          queryKey: sanitizeTelemetryData(query.queryKey),
        },
      });

      telemetry.recordEvent(
        'query_failed',
        {
          keyName,
          error: error instanceof Error ? error.message : String(error),
        },
        'warn',
      );
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const keyName = getSafeKey(mutation.options.mutationKey);
      telemetry.addBreadcrumb({
        category: 'mutation',
        message: `Mutation failed: ${keyName}`,
        level: 'warn',
        data: {
          mutationKey: sanitizeTelemetryData(mutation.options.mutationKey),
        },
      });

      telemetry.captureException(error, {
        metadata: {
          context: 'mutation_failed',
          mutationKey: keyName,
        },
      });
    },
  }),
});
