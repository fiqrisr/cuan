import { describe, expect, mock, test } from 'bun:test';
import { HttpTelemetryTransport } from './http-transport';

describe('HttpTelemetryTransport', () => {
  test('buffers items and flushes when reaching maxBatchSize', () => {
    let capturedBody = '';
    const originalFetch = globalThis.fetch;

    globalThis.fetch = mock((_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return Promise.resolve(new Response(null, { status: 200 }));
    }) as unknown as typeof fetch;

    try {
      const transport = new HttpTelemetryTransport({
        endpoint: 'http://localhost/api/telemetry',
        maxBatchSize: 3,
        flushIntervalMs: 60_000,
      });

      transport.onEvent({
        name: 'event_1',
        level: 'info',
        timestamp: Date.now(),
      });
      expect(capturedBody).toBe('');

      transport.onEvent({
        name: 'event_2',
        level: 'info',
        timestamp: Date.now(),
      });
      expect(capturedBody).toBe('');

      transport.onEvent({
        name: 'event_3',
        level: 'info',
        timestamp: Date.now(),
      });

      expect(capturedBody).not.toBe('');
      const parsed = JSON.parse(capturedBody) as { items: Array<{ name: string }> };
      expect(parsed.items).toHaveLength(3);
      expect(parsed.items[0].name).toBe('event_1');
      expect(parsed.items[1].name).toBe('event_2');
      expect(parsed.items[2].name).toBe('event_3');

      transport.stop();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('immediately flushes on error', () => {
    let capturedBody = '';
    const originalFetch = globalThis.fetch;

    globalThis.fetch = mock((_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return Promise.resolve(new Response(null, { status: 200 }));
    }) as unknown as typeof fetch;

    try {
      const transport = new HttpTelemetryTransport({
        endpoint: 'http://localhost/api/telemetry',
        maxBatchSize: 20,
        flushIntervalMs: 60_000,
      });

      transport.onError({
        name: 'TypeError',
        message: 'Cannot read properties of undefined',
        breadcrumbs: [],
        timestamp: Date.now(),
      });

      expect(capturedBody).not.toBe('');
      const parsed = JSON.parse(capturedBody) as { items: Array<{ type: string; name: string }> };
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].type).toBe('error');
      expect(parsed.items[0].name).toBe('TypeError');

      transport.stop();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
