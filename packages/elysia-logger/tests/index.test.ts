import { beforeEach, describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import {
  createRequestContext,
  getStatusFamily,
  Logger,
  logger,
  metrics,
  requestContext,
  rootLogger,
} from '../src';

describe('elysia-logger package', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('Exports', () => {
    it('exports all expected symbols', () => {
      expect(Logger).toBeDefined();
      expect(logger).toBeDefined();
      expect(rootLogger).toBeDefined();
      expect(metrics).toBeDefined();
      expect(getStatusFamily).toBeDefined();
      expect(requestContext).toBeDefined();
      expect(createRequestContext).toBeDefined();
    });
  });

  describe('Logger class', () => {
    it('logs JSON with msg and event in production mode', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (str: string) => {
        logs.push(str);
      };

      try {
        const testLogger = new Logger(
          { app: 'test-app' },
          { minLevel: 'info', isDevelopment: false },
        );
        testLogger.info({ event: 'server_boot', port: 8080 }, 'Server booted');

        expect(logs.length).toBe(1);
        const parsed = JSON.parse(logs[0]);
        expect(parsed.level).toBe('info');
        expect(parsed.event).toBe('server_boot');
        expect(parsed.app).toBe('test-app');
        expect(parsed.port).toBe(8080);
        expect(parsed.msg).toBe('Server booted');
        expect(parsed.undefined).toBeUndefined();
        expect(parsed.time).toBeDefined();
      } finally {
        console.log = originalLog;
      }
    });

    it('redacts sensitive keys', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (str: string) => {
        logs.push(str);
      };

      try {
        const testLogger = new Logger({}, { minLevel: 'info', isDevelopment: false });
        testLogger.info({
          password: 'secret-password',
          token: 'jwt-token',
          authorization: 'Bearer auth-token',
          apiKey: 'key-12345',
          safeKey: 'visible',
        });

        expect(logs.length).toBe(1);
        const parsed = JSON.parse(logs[0]);
        expect(parsed.password).toBe('[REDACTED]');
        expect(parsed.token).toBe('[REDACTED]');
        expect(parsed.authorization).toBe('[REDACTED]');
        expect(parsed.apiKey).toBe('[REDACTED]');
        expect(parsed.safeKey).toBe('visible');
      } finally {
        console.log = originalLog;
      }
    });

    it('creates child loggers with context inheritance', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (str: string) => {
        logs.push(str);
      };

      try {
        const root = new Logger(
          { service: 'auth-svc' },
          { minLevel: 'info', isDevelopment: false },
        );
        const child1 = root.child({ requestId: 'req-001' });
        const child2 = child1.child({ userId: 'user-002' });

        child2.info({ event: 'token_issued' }, 'Issued token');

        expect(logs.length).toBe(1);
        const parsed = JSON.parse(logs[0]);
        expect(parsed.service).toBe('auth-svc');
        expect(parsed.requestId).toBe('req-001');
        expect(parsed.userId).toBe('user-002');
        expect(parsed.event).toBe('token_issued');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('MetricsRegistry', () => {
    it('records and snapshots RED HTTP metrics', () => {
      metrics.recordHttpRequest('GET', '/users', 200, 30);
      metrics.recordHttpRequest('GET', '/users', 500, 300);

      const snapshot = metrics.getSnapshot();
      expect(snapshot.http.totalRequests).toBe(2);
      expect(snapshot.http.requestsByRoute['GET /users']['2xx']).toBe(1);
      expect(snapshot.http.requestsByRoute['GET /users']['5xx']).toBe(1);
    });

    it('records and snapshots AI generation metrics', () => {
      metrics.recordAiGeneration({
        model: 'gemini-1.5-pro',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        durationMs: 400,
      });

      const snapshot = metrics.getSnapshot();
      expect(snapshot.ai.totalRequests).toBe(1);
      expect(snapshot.ai.totalTokens.total).toBe(150);
      expect(snapshot.ai.tokensByModel['gemini-1.5-pro'].total).toBe(150);
    });
  });

  describe('Elysia Middleware', () => {
    it('injects requestId and sets x-request-id response header', async () => {
      const app = new Elysia()
        .use(requestContext)
        .get('/ping', ({ requestId }) => ({ ping: 'pong', requestId }));

      const res = await app.handle(new Request('http://localhost/ping'));
      expect(res.status).toBe(200);

      const headerReqId = res.headers.get('x-request-id');
      expect(headerReqId).toBeDefined();

      const body = (await res.json()) as { ping: string; requestId: string };
      expect(body.ping).toBe('pong');
      expect(body.requestId).toBe(headerReqId ?? '');
    });

    it('preserves existing client x-request-id', async () => {
      const app = new Elysia()
        .use(requestContext)
        .get('/ping', ({ requestId }) => ({ ping: 'pong', requestId }));

      const clientTraceId = 'trace-client-xyz-789';
      const res = await app.handle(
        new Request('http://localhost/ping', {
          headers: { 'x-request-id': clientTraceId },
        }),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('x-request-id')).toBe(clientTraceId);

      const body = (await res.json()) as { ping: string; requestId: string };
      expect(body.requestId).toBe(clientTraceId);
    });
  });
});
