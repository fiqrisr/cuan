import { describe, expect, it } from 'bun:test';
import { app } from '@/app';

describe('Telemetry Ingestion API', () => {
  it('accepts and processes a valid telemetry batch on POST /api/telemetry', async () => {
    const payload = {
      items: [
        {
          type: 'event',
          name: 'user_action',
          level: 'info',
          timestamp: Date.now(),
          requestId: 'client-req-001',
          data: { action: 'clicked_button' },
        },
        {
          type: 'metric',
          name: 'web_vitals_inp',
          value: 45,
          unit: 'ms',
          tags: { rating: 'good' },
          timestamp: Date.now(),
        },
        {
          type: 'error',
          name: 'ChunkLoadError',
          level: 'error',
          timestamp: Date.now(),
          stack: 'Error: Failed to fetch...\n at app.js:1:1',
          context: { routeId: '/dashboard' },
        },
      ],
    };

    const res = await app.handle(
      new Request('http://localhost/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '203.0.113.195',
        },
        body: JSON.stringify(payload),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; processed: number };
    expect(body.success).toBe(true);
    expect(body.processed).toBe(3);
  });

  it('rejects payload with invalid item type', async () => {
    const invalidPayload = {
      items: [
        {
          type: 'unsupported_type',
          name: 'test',
          timestamp: Date.now(),
        },
      ],
    };

    const res = await app.handle(
      new Request('http://localhost/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      }),
    );

    expect(res.status).toBe(422);
  });

  it('rejects payload exceeding max items limit of 50', async () => {
    const items = [];
    for (let i = 0; i < 51; i++) {
      items.push({
        type: 'event',
        name: `event_${i}`,
        timestamp: Date.now(),
      });
    }

    const res = await app.handle(
      new Request('http://localhost/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }),
    );

    expect(res.status).toBe(422);
  });
});
