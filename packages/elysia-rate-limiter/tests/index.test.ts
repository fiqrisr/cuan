import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { createRateLimiter, getClientIp, MemoryRateLimitStore } from '../src';

describe('@cuan/elysia-rate-limiter', () => {
  describe('getClientIp', () => {
    it('prefers cf-connecting-ip', () => {
      const req = new Request('http://localhost/api', {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'x-forwarded-for': '5.6.7.8',
        },
      });
      expect(getClientIp(req)).toBe('1.2.3.4');
    });

    it('falls back to x-forwarded-for and x-real-ip', () => {
      const reqFwd = new Request('http://localhost/api', {
        headers: { 'x-forwarded-for': '5.6.7.8, 9.10.11.12' },
      });
      expect(getClientIp(reqFwd)).toBe('5.6.7.8');

      const reqReal = new Request('http://localhost/api', {
        headers: { 'x-real-ip': '9.10.11.12' },
      });
      expect(getClientIp(reqReal)).toBe('9.10.11.12');

      const reqLocal = new Request('http://localhost/api');
      expect(getClientIp(reqLocal)).toBe('127.0.0.1');
    });
  });

  describe('MemoryRateLimitStore', () => {
    it('increments correctly and expires window', () => {
      const store = new MemoryRateLimitStore(50, 10);
      const r1 = store.increment('test:ip', 60_000);
      expect(r1.count).toBe(1);

      const r2 = store.increment('test:ip', 60_000);
      expect(r2.count).toBe(2);

      const rExpired = store.increment('expired:ip', -10);
      expect(rExpired.count).toBe(1);

      const rNew = store.increment('expired:ip', 60_000);
      expect(rNew.count).toBe(1);
    });

    it('enforces maxEntries capacity', () => {
      const store = new MemoryRateLimitStore(3, 5);
      for (let i = 0; i < 10; i++) {
        store.increment(`key:${i}`, 60_000);
      }
      expect(store.size).toBeLessThanOrEqual(3);
    });

    it('clears records on reset', () => {
      const store = new MemoryRateLimitStore(50, 10);
      store.increment('k1', 60_000);
      store.increment('k2', 60_000);
      expect(store.size).toBe(2);
      store.reset();
      expect(store.size).toBe(0);
    });
  });

  describe('createRateLimiter', () => {
    it('sets standard rate limit headers', async () => {
      const app = new Elysia()
        .use(
          createRateLimiter({
            defaultLimit: { max: 5, windowMs: 60_000 },
          }),
        )
        .get('/test', () => ({ ok: true }));

      const res = await app.handle(new Request('http://localhost/test'));
      expect(res.status).toBe(200);
      expect(res.headers.get('RateLimit-Limit')).toBe('5');
      expect(res.headers.get('RateLimit-Remaining')).toBe('4');
      expect(Number(res.headers.get('RateLimit-Reset'))).toBeGreaterThan(0);
    });

    it('throttles when limit exceeded', async () => {
      const app = new Elysia()
        .use(
          createRateLimiter({
            defaultLimit: { max: 1, windowMs: 60_000 },
          }),
        )
        .get('/test', () => ({ ok: true }));

      const res1 = await app.handle(
        new Request('http://localhost/test', {
          headers: { 'cf-connecting-ip': '8.8.8.8', Origin: 'http://localhost:3000' },
        }),
      );
      expect(res1.status).toBe(200);

      const res2 = await app.handle(
        new Request('http://localhost/test', {
          headers: { 'cf-connecting-ip': '8.8.8.8', Origin: 'http://localhost:3000' },
        }),
      );
      expect(res2.status).toBe(429);
      expect(res2.headers.get('Retry-After')).toBeDefined();
      expect(res2.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');

      const body = (await res2.json()) as { code: string };
      expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('supports custom tier resolution and limits', async () => {
      type Tiers = 'strict' | 'normal';
      const app = new Elysia()
        .use(
          createRateLimiter<Tiers>({
            limits: {
              strict: { max: 1, windowMs: 60_000 },
              normal: { max: 10, windowMs: 60_000 },
            },
            resolveTier: req => {
              const url = new URL(req.url);
              return url.pathname.includes('/strict') ? 'strict' : 'normal';
            },
          }),
        )
        .get('/strict', () => ({ ok: true }))
        .get('/normal', () => ({ ok: true }));

      const ip = '7.7.7.7';
      const rStrict1 = await app.handle(
        new Request('http://localhost/strict', { headers: { 'cf-connecting-ip': ip } }),
      );
      expect(rStrict1.status).toBe(200);

      const rStrict2 = await app.handle(
        new Request('http://localhost/strict', { headers: { 'cf-connecting-ip': ip } }),
      );
      expect(rStrict2.status).toBe(429);

      // Normal route should still work
      const rNormal1 = await app.handle(
        new Request('http://localhost/normal', { headers: { 'cf-connecting-ip': ip } }),
      );
      expect(rNormal1.status).toBe(200);
    });

    it('supports custom keyGenerator and customErrorMessage', async () => {
      const app = new Elysia()
        .use(
          createRateLimiter({
            defaultLimit: { max: 1, windowMs: 60_000 },
            keyGenerator: (req, tier) => `user:${req.headers.get('x-user-id') ?? 'anon'}:${tier}`,
            customErrorMessage: (tier, retry) =>
              `Rate limit exceeded for ${tier}. Try again in ${retry}s.`,
          }),
        )
        .get('/custom', () => ({ ok: true }));

      const req1 = new Request('http://localhost/custom', {
        headers: { 'x-user-id': 'user_123' },
      });
      const r1 = await app.handle(req1);
      expect(r1.status).toBe(200);

      const req2 = new Request('http://localhost/custom', {
        headers: { 'x-user-id': 'user_123' },
      });
      const r2 = await app.handle(req2);
      expect(r2.status).toBe(429);
      const body = (await r2.json()) as { message: string };
      expect(body.message).toContain('Rate limit exceeded for default');

      // Different user should not be throttled
      const reqOther = new Request('http://localhost/custom', {
        headers: { 'x-user-id': 'user_456' },
      });
      const rOther = await app.handle(reqOther);
      expect(rOther.status).toBe(200);
    });

    it('skips requests when skip function returns true', async () => {
      const app = new Elysia()
        .use(
          createRateLimiter({
            defaultLimit: { max: 1, windowMs: 60_000 },
            skip: req => req.headers.get('x-bypass') === 'true',
          }),
        )
        .get('/bypass', () => ({ ok: true }));

      for (let i = 0; i < 5; i++) {
        const res = await app.handle(
          new Request('http://localhost/bypass', {
            headers: { 'x-bypass': 'true' },
          }),
        );
        expect(res.status).toBe(200);
      }
    });
  });
});
