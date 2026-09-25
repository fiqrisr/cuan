import { describe, expect, it } from 'bun:test';
import { app } from '@/app';
import { getValidatedEnv } from '@/env';
import worker from '@/index';

describe('CORS and Auth Routes in Development', () => {
  it('allows CORS preflight for http://localhost:5173 on auth routes', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/auth/api/sign-in/email', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, X-Custom-Header',
        },
      }),
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('X-Custom-Header');
  });

  it('allows CORS preflight for http://127.0.0.1:5173 on auth routes', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/auth/api/get-session', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://127.0.0.1:5173',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      }),
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:5173');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('allows CORS preflight for http://localhost:3000 on auth routes', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/auth/api/sign-in/email', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
        },
      }),
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
  });

  it('rejects disallowed origins', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/auth/api/sign-in/email', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://malicious-site.example.com',
          'Access-Control-Request-Method': 'POST',
        },
      }),
    );

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('handles sign-up and sets development-safe cookies without domain restriction', async () => {
    const email = `cors-test-${Date.now()}@example.com`;
    const res = await app.handle(
      new Request('http://localhost:3000/auth/api/sign-up/email', {
        method: 'POST',
        headers: {
          Origin: 'http://localhost:5173',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: 'password123',
          name: 'CORS Test User',
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    // In dev mode, must NOT set domain=core.cuan.fiqri.dev or __Secure- prefix
    expect(setCookie).not.toContain('Domain=core.cuan.fiqri.dev');
    expect(setCookie).not.toContain('__Secure-');
    expect(setCookie).toContain('better-auth.session_token');

    // Sign in with the newly created user
    const signInRes = await app.handle(
      new Request('http://localhost:3000/auth/api/sign-in/email', {
        method: 'POST',
        headers: {
          Origin: 'http://localhost:5173',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: 'password123',
        }),
      }),
    );

    expect(signInRes.status).toBe(200);
    expect(signInRes.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');

    // Retrieve session using cookie
    const token = setCookie?.split(';')[0];
    const sessionRes = await app.handle(
      new Request('http://localhost:3000/auth/api/get-session', {
        method: 'GET',
        headers: {
          Origin: 'http://localhost:5173',
          Cookie: token || '',
        },
      }),
    );

    expect(sessionRes.status).toBe(200);
    const sessionData = (await sessionRes.json()) as { user?: { email: string } };
    expect(sessionData.user?.email).toBe(email);
  });

  it('validates environment with empty string optional URLs safely', () => {
    const rawEnv = {
      PORT: '3000',
      BETTER_AUTH_SECRET: '8vfx2Hh32kF4pPbp92HS3wQqx9IXKvxD',
      BETTER_AUTH_URL: '',
      FRONTEND_URL: '',
      LOG_LEVEL: 'info',
      NODE_ENV: 'development',
      CLOUDFLARE_ACCOUNT_ID: 'test-account',
      CLOUDFLARE_DATABASE_ID: 'test-db',
      CLOUDFLARE_D1_TOKEN: 'test-token',
      AI_PROVIDER: 'gemini',
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-flash',
    };

    const parsed = getValidatedEnv(rawEnv);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.FRONTEND_URL).toBeUndefined();
      expect(parsed.data.BETTER_AUTH_URL).toBeUndefined();
    }
  });

  it('worker entrypoint returns 500 with CORS headers on invalid environment', async () => {
    const invalidWorkerEnv = {
      // missing required fields
    } as unknown as Parameters<typeof worker.fetch>[1];

    const res = await worker.fetch(
      new Request('http://localhost:3000/auth/api/get-session', {
        headers: { Origin: 'http://localhost:5173' },
      }),
      invalidWorkerEnv,
    );

    expect(res.status).toBe(500);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('INVALID_ENVIRONMENT');
  });
});
