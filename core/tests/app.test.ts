import { describe, expect, it } from 'bun:test';
import { app } from '@/app';
import { setD1Binding } from '@/db';

describe('App Root and Health Routes', () => {
  it('returns metadata on GET /', async () => {
    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      name: string;
      version: string;
      description: string;
      environment: string;
      health: string;
      timestamp: string;
    };

    expect(body.name).toBe('cuan-core');
    expect(body.version).toBe('0.0.0');
    expect(body.description).toBe('Cuan backend API powered by Elysia.js');
    expect(body.environment).toBeDefined();
    expect(body.health).toBe('/health');
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  it('returns 200 and healthy status on GET /health when database is connected', async () => {
    const res = await app.handle(new Request('http://localhost/health'));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
      services: {
        database: {
          status: string;
          latencyMs?: number;
          error?: string;
        };
      };
    };

    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(body.environment).toBeDefined();
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
    expect(body.services.database.status).toBe('healthy');
    expect(typeof body.services.database.latencyMs).toBe('number');
  });

  it('returns 503 and degraded status on GET /health when database fails', async () => {
    const scope = globalThis as { CLOUDFLARE_D1_BINDING_NAME?: D1Database };
    const originalBinding = scope.CLOUDFLARE_D1_BINDING_NAME;

    const brokenBinding = {
      prepare() {
        throw new Error('D1 connection lost');
      },
      dump: () => Promise.reject(new Error('D1 connection lost')),
      batch: () => Promise.reject(new Error('D1 connection lost')),
      exec: () => Promise.reject(new Error('D1 connection lost')),
    } as unknown as D1Database;

    setD1Binding(brokenBinding);

    try {
      const res = await app.handle(new Request('http://localhost/health'));
      expect(res.status).toBe(503);

      const body = (await res.json()) as {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
        services: {
          database: {
            status: string;
            latencyMs?: number;
            error?: string;
          };
        };
      };

      expect(body.status).toBe('degraded');
      expect(body.services.database.status).toBe('unhealthy');
      expect(body.services.database.error).toContain('Failed to run the query');
    } finally {
      if (originalBinding) {
        setD1Binding(originalBinding);
      }
    }
  });
});
