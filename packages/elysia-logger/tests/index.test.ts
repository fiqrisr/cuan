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

    it('records RED metrics and logs synchronously on app.fetch without event loop tick', async () => {
      let loggedMessage = '';
      class RecordingLogger extends Logger {
        override info(dataOrMsg: Record<string, unknown> | string, msg?: string) {
          loggedMessage = typeof dataOrMsg === 'string' ? dataOrMsg : (msg ?? '');
          super.info(dataOrMsg, msg);
        }
      }

      const customLogger = new RecordingLogger({}, 'info');
      const app = new Elysia()
        .use(createRequestContext({ logger: customLogger }))
        .get('/fast', () => ({ ok: true }));

      const res = await app.fetch(new Request('http://localhost/fast'));
      expect(res.status).toBe(200);

      // Synchronously logged before any setTimeout
      expect(loggedMessage).toContain('GET /fast 200');

      const snap = metrics.getSnapshot();
      expect(snap.http.totalRequests).toBe(1);
      expect(snap.http.requestsByRoute['GET /fast']['2xx']).toBe(1);
    });

    it('records errors and status codes accurately with single log entry', async () => {
      const logs: string[] = [];
      class RecordingLogger extends Logger {
        override info(dataOrMsg: Record<string, unknown> | string, msg?: string) {
          logs.push(typeof dataOrMsg === 'string' ? dataOrMsg : (msg ?? ''));
          super.info(dataOrMsg, msg);
        }
        override warn(dataOrMsg: Record<string, unknown> | string, msg?: string) {
          logs.push(typeof dataOrMsg === 'string' ? dataOrMsg : (msg ?? ''));
          super.warn(dataOrMsg, msg);
        }
        override error(dataOrMsg: Record<string, unknown> | string, msg?: string) {
          logs.push(typeof dataOrMsg === 'string' ? dataOrMsg : (msg ?? ''));
          super.error(dataOrMsg, msg);
        }
      }

      const customLogger = new RecordingLogger({}, 'info');
      const app = new Elysia()
        .use(createRequestContext({ logger: customLogger }))
        .onError(({ code, set }) => {
          if (code === 'NOT_FOUND') {
            set.status = 404;
            return { error: 'Not found' };
          }
          set.status = 500;
          return { error: 'Server error' };
        })
        .post('/items', ({ set }) => {
          set.status = 201;
          return { created: true };
        })
        .get('/boom', () => {
          throw new Error('fail');
        });

      const res1 = await app.fetch(new Request('http://localhost/items', { method: 'POST' }));
      expect(res1.status).toBe(201);

      const res2 = await app.fetch(new Request('http://localhost/boom'));
      expect(res2.status).toBe(500);

      const res3 = await app.fetch(new Request('http://localhost/missing'));
      expect(res3.status).toBe(404);

      expect(logs).toHaveLength(3);
      expect(logs[0]).toContain('POST /items 201');
      expect(logs[1]).toContain('GET /boom 500');
      expect(logs[2]).toContain('GET /missing 404');
    });
  });
});
