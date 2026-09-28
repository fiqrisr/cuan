import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import {
  createRateLimiter,
  getClientIp,
  MemoryRateLimitStore,
  resolveRateLimitTier,
} from '@/middleware/rate-limiter';

describe('Rate Limiter Utility Functions', () => {
  describe('getClientIp', () => {
    it('prioritizes cf-connecting-ip', () => {
      const req = new Request('http://localhost/api/test', {
        headers: {
          'cf-connecting-ip': '198.51.100.1',
          'x-forwarded-for': '203.0.113.1, 10.0.0.1',
          'x-real-ip': '192.0.2.1',
        },
      });
      expect(getClientIp(req)).toBe('198.51.100.1');
    });

    it('falls back to first IP in x-forwarded-for when cf-connecting-ip is absent', () => {
      const req = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 10.0.0.1',
          'x-real-ip': '192.0.2.1',
        },
      });
      expect(getClientIp(req)).toBe('203.0.113.1');
    });

    it('falls back to x-real-ip when preceding headers are absent', () => {
      const req = new Request('http://localhost/api/test', {
        headers: {
          'x-real-ip': '192.0.2.1',
        },
      });
      expect(getClientIp(req)).toBe('192.0.2.1');
    });

    it('defaults to 127.0.0.1 when no IP headers are present', () => {
      const req = new Request('http://localhost/api/test');
      expect(getClientIp(req)).toBe('127.0.0.1');
    });
  });

  describe('resolveRateLimitTier', () => {
    it('returns null for OPTIONS preflight requests', () => {
      const req = new Request('http://localhost/api/chat', { method: 'OPTIONS' });
      expect(resolveRateLimitTier(req)).toBeNull();
    });

    it('returns null for system/health endpoints', () => {
      expect(resolveRateLimitTier(new Request('http://localhost/'))).toBeNull();
      expect(resolveRateLimitTier(new Request('http://localhost/health'))).toBeNull();
      expect(resolveRateLimitTier(new Request('http://localhost/metrics'))).toBeNull();
    });

    it('classifies auth mutation requests as auth tier', () => {
      const postLogin = new Request('http://localhost/auth/api/sign-in/email', { method: 'POST' });
      const postRegister = new Request('http://localhost/auth/api/sign-up/email', {
        method: 'POST',
      });
      const resetPass = new Request('http://localhost/auth/api/reset-password', { method: 'POST' });

      expect(resolveRateLimitTier(postLogin)).toBe('auth');
      expect(resolveRateLimitTier(postRegister)).toBe('auth');
      expect(resolveRateLimitTier(resetPass)).toBe('auth');
    });

    it('classifies read-only session check as general api tier', () => {
      const getSession = new Request('http://localhost/auth/api/get-session', { method: 'GET' });
      expect(resolveRateLimitTier(getSession)).toBe('api');
    });

    it('classifies chat endpoints as chat tier', () => {
      const chat = new Request('http://localhost/api/chat', { method: 'POST' });
      const chatStream = new Request('http://localhost/api/chat/stream', { method: 'POST' });

      expect(resolveRateLimitTier(chat)).toBe('chat');
      expect(resolveRateLimitTier(chatStream)).toBe('chat');
    });

    it('classifies standard domain routes as api tier', () => {
      expect(resolveRateLimitTier(new Request('http://localhost/api/transactions'))).toBe('api');
      expect(resolveRateLimitTier(new Request('http://localhost/api/categories'))).toBe('api');
      expect(resolveRateLimitTier(new Request('http://localhost/api/financial-accounts'))).toBe(
        'api',
      );
      expect(resolveRateLimitTier(new Request('http://localhost/api/telemetry'))).toBe('api');
    });
  });
});

describe('MemoryRateLimitStore', () => {
  it('increments request count within active window', () => {
    const store = new MemoryRateLimitStore(100, 50);
    const first = store.increment('test:127.0.0.1', 60_000);
    expect(first.count).toBe(1);

    const second = store.increment('test:127.0.0.1', 60_000);
    expect(second.count).toBe(2);
    expect(second.resetAt).toBe(first.resetAt);
  });

  it('resets count when window expires', () => {
    const store = new MemoryRateLimitStore(100, 50);
    // windowMs: -1 means window immediately expired in the past
    const first = store.increment('test:127.0.0.1', -1);
    expect(first.count).toBe(1);

    const second = store.increment('test:127.0.0.1', 60_000);
    expect(second.count).toBe(1);
  });

  it('evicts expired records on cleanup', () => {
    const store = new MemoryRateLimitStore(100, 50);
    store.increment('expired:1', -100);
    store.increment('active:1', 60_000);

    store.cleanup();
    expect(store.size).toBe(1);
  });

  it('caps maxEntries to prevent memory leak', () => {
    const store = new MemoryRateLimitStore(5, 10);
    for (let i = 0; i < 10; i++) {
      store.increment(`key:${i}`, 60_000);
    }
    expect(store.size).toBeLessThanOrEqual(5);
  });
});

describe('Rate Limiter Middleware Integration', () => {
  it('adds rate limit headers to allowed requests', async () => {
    const testApp = new Elysia()
      .use(
        createRateLimiter({
          api: { max: 10, windowMs: 60_000 },
        }),
      )
      .get('/api/test', () => ({ ok: true }));

    const res = await testApp.handle(
      new Request('http://localhost/api/test', {
        headers: { 'cf-connecting-ip': '10.10.10.1' },
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('RateLimit-Limit')).toBe('10');
    expect(res.headers.get('RateLimit-Remaining')).toBe('9');
    expect(Number(res.headers.get('RateLimit-Reset'))).toBeGreaterThan(0);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9');
  });

  it('returns 429 with standard error payload and retry headers when limit exceeded', async () => {
    const testApp = new Elysia()
      .use(
        createRateLimiter({
          chat: { max: 2, windowMs: 60_000 },
        }),
      )
      .post('/api/chat', () => ({ message: 'ok' }));

    const ip = '10.20.30.40';
    const makeReq = () =>
      testApp.handle(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: {
            'cf-connecting-ip': ip,
            Origin: 'http://localhost:5173',
          },
        }),
      );

    const res1 = await makeReq();
    expect(res1.status).toBe(200);
    expect(res1.headers.get('RateLimit-Remaining')).toBe('1');

    const res2 = await makeReq();
    expect(res2.status).toBe(200);
    expect(res2.headers.get('RateLimit-Remaining')).toBe('0');

    // Third request exceeds limit (max 2)
    const res3 = await makeReq();
    expect(res3.status).toBe(429);
    expect(res3.headers.get('Retry-After')).toBeDefined();
    expect(res3.headers.get('RateLimit-Remaining')).toBe('0');
    expect(res3.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');

    const body = (await res3.json()) as {
      error: string;
      code: string;
      message: string;
      details: { tier: string; limit: number; retryAfter: number };
    };

    expect(body.error).toBe('Too Many Requests');
    expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.details.tier).toBe('chat');
    expect(body.details.limit).toBe(2);
    expect(body.details.retryAfter).toBeGreaterThan(0);
  });

  it('isolates rate limits by client IP', async () => {
    const testApp = new Elysia()
      .use(
        createRateLimiter({
          api: { max: 1, windowMs: 60_000 },
        }),
      )
      .get('/api/resource', () => ({ ok: true }));

    const resIp1First = await testApp.handle(
      new Request('http://localhost/api/resource', {
        headers: { 'cf-connecting-ip': '1.1.1.1' },
      }),
    );
    expect(resIp1First.status).toBe(200);

    const resIp1Second = await testApp.handle(
      new Request('http://localhost/api/resource', {
        headers: { 'cf-connecting-ip': '1.1.1.1' },
      }),
    );
    expect(resIp1Second.status).toBe(429);

    // Different IP should still succeed
    const resIp2First = await testApp.handle(
      new Request('http://localhost/api/resource', {
        headers: { 'cf-connecting-ip': '2.2.2.2' },
      }),
    );
    expect(resIp2First.status).toBe(200);
  });

  it('isolates rate limits by endpoint tier', async () => {
    const testApp = new Elysia()
      .use(
        createRateLimiter({
          auth: { max: 1, windowMs: 60_000 },
          chat: { max: 5, windowMs: 60_000 },
        }),
      )
      .post('/auth/api/sign-in/email', () => ({ ok: true }))
      .post('/api/chat', () => ({ ok: true }));

    const ip = '3.3.3.3';

    // Exhaust auth limit (max 1)
    const auth1 = await testApp.handle(
      new Request('http://localhost/auth/api/sign-in/email', {
        method: 'POST',
        headers: { 'cf-connecting-ip': ip },
      }),
    );
    expect(auth1.status).toBe(200);

    const auth2 = await testApp.handle(
      new Request('http://localhost/auth/api/sign-in/email', {
        method: 'POST',
        headers: { 'cf-connecting-ip': ip },
      }),
    );
    expect(auth2.status).toBe(429);

    // Chat endpoint should still be allowed under its separate quota
    const chat1 = await testApp.handle(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'cf-connecting-ip': ip },
      }),
    );
    expect(chat1.status).toBe(200);
  });

  it('bypasses rate limiting for health and root endpoints', async () => {
    const testApp = new Elysia()
      .use(
        createRateLimiter({
          api: { max: 1, windowMs: 60_000 },
        }),
      )
      .get('/', () => ({ status: 'root' }))
      .get('/health', () => ({ status: 'healthy' }))
      .get('/metrics', () => ({ status: 'metrics' }));

    const ip = '4.4.4.4';

    for (let i = 0; i < 5; i++) {
      const resHealth = await testApp.handle(
        new Request('http://localhost/health', {
          headers: { 'cf-connecting-ip': ip },
        }),
      );
      expect(resHealth.status).toBe(200);

      const resRoot = await testApp.handle(
        new Request('http://localhost/', {
          headers: { 'cf-connecting-ip': ip },
        }),
      );
      expect(resRoot.status).toBe(200);

      const resMetrics = await testApp.handle(
        new Request('http://localhost/metrics', {
          headers: { 'cf-connecting-ip': ip },
        }),
      );
      expect(resMetrics.status).toBe(200);
    }
  });

  it('respects custom skip predicate', async () => {
    const testApp = new Elysia()
      .use(
        createRateLimiter({
          api: { max: 1, windowMs: 60_000 },
          skip: req => req.headers.get('x-internal-service') === 'trusted',
        }),
      )
      .get('/api/internal', () => ({ ok: true }));

    const ip = '5.5.5.5';

    for (let i = 0; i < 5; i++) {
      const res = await testApp.handle(
        new Request('http://localhost/api/internal', {
          headers: {
            'cf-connecting-ip': ip,
            'x-internal-service': 'trusted',
          },
        }),
      );
      expect(res.status).toBe(200);
    }
  });
});
