import { describe, expect, test } from 'bun:test';
import { telemetry } from '../telemetry';
import { queryClient } from './query-client';

describe('queryClient telemetry instrumentation', () => {
  test('records query_failed event on query error', () => {
    let recordedEventName = '';
    let recordedData: Record<string, unknown> | undefined;

    const unsubscribe = telemetry.addTransport({
      name: 'query-cache-test',
      onEvent: event => {
        if (event.name === 'query_failed') {
          recordedEventName = event.name;
          recordedData = event.data;
        }
      },
    });

    try {
      const queryCache = queryClient.getQueryCache();
      const mockQuery = queryCache.build(queryClient, {
        queryKey: ['financial-accounts', { filter: 'active' }],
        queryFn: () => Promise.reject(new Error('Failed to load accounts')),
      });

      // Trigger onError on QueryCache
      queryCache.config.onError?.(
        new Error('Failed to load accounts'),
        mockQuery as unknown as Parameters<NonNullable<typeof queryCache.config.onError>>[1],
      );

      expect(recordedEventName).toBe('query_failed');
      expect(recordedData?.keyName).toBe('financial-accounts');
      expect(recordedData?.error).toBe('Failed to load accounts');
    } finally {
      unsubscribe();
    }
  });
});
