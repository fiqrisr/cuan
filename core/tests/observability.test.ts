import { beforeEach, describe, expect, it } from 'bun:test';
import { app } from '@/app';
import { Logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

describe('Observability & Instrumentation', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('Structured Logger', () => {
    it('formats structured log events with msg key and event name', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (str: string) => {
        logs.push(str);
      };

      try {
        const logger = new Logger({ service: 'test-service' }, 'debug');
        logger.info({ event: 'test_event', foo: 'bar' }, 'Test message');

        expect(logs.length).toBe(1);
        const parsed = JSON.parse(logs[0]);
        expect(parsed.level).toBe('info');
        expect(parsed.event).toBe('test_event');
        expect(parsed.service).toBe('test-service');
        expect(parsed.foo).toBe('bar');
        expect(parsed.msg).toBe('Test message');
        expect(parsed.undefined).toBeUndefined(); // Guarantees the old bug is resolved
        expect(parsed.time).toBeDefined();
      } finally {
        console.log = originalLog;
      }
    });

    it('redacts sensitive fields in log payloads', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (str: string) => {
        logs.push(str);
      };

      try {
        const logger = new Logger({}, 'info');
        logger.info(
          {
            event: 'user_login',
            password: 'super-secret-password',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz',
            apiKey: 'sk-1234567890abcdef',
            authorization: 'Bearer secret-token-xyz',
            safeField: 'normal-value',
          },
          'User logged in',
        );

        expect(logs.length).toBe(1);
        const parsed = JSON.parse(logs[0]);
        expect(parsed.password).toBe('[REDACTED]');
        expect(parsed.token).toBe('[REDACTED]');
        expect(parsed.apiKey).toBe('[REDACTED]');
        expect(parsed.authorization).toBe('[REDACTED]');
        expect(parsed.safeField).toBe('normal-value');
      } finally {
        console.log = originalLog;
      }
    });

    it('creates child loggers that inherit and extend context', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (str: string) => {
        logs.push(str);
      };

      try {
        const root = new Logger({ service: 'cuan' }, 'info');
        const reqLogger = root.child({ requestId: 'req-123' });
        const userLogger = reqLogger.child({ userId: 'user-456' });

        userLogger.info({ event: 'action_completed' }, 'Action done');

        expect(logs.length).toBe(1);
        const parsed = JSON.parse(logs[0]);
        expect(parsed.service).toBe('cuan');
        expect(parsed.requestId).toBe('req-123');
        expect(parsed.userId).toBe('user-456');
        expect(parsed.event).toBe('action_completed');
      } finally {
        console.log = originalLog;
      }
    });

    it('filters out logs below minimum log level', () => {
      const logs: string[] = [];
      const originalDebug = console.debug;
      console.debug = (str: string) => {
        logs.push(str);
      };

      try {
        const logger = new Logger({}, 'warn');
        logger.debug({ event: 'debug_event' }, 'Should not appear');

        expect(logs.length).toBe(0);
      } finally {
        console.debug = originalDebug;
      }
    });
  });

  describe('RED & AI Metrics Engine', () => {
    it('records HTTP request rates, status families, and duration histograms', () => {
      metrics.recordHttpRequest('GET', '/api/transactions', 200, 15);
      metrics.recordHttpRequest('GET', '/api/transactions', 200, 80);
      metrics.recordHttpRequest('POST', '/api/transactions', 201, 120);
      metrics.recordHttpRequest('GET', '/api/transactions', 404, 5);
      metrics.recordHttpRequest('POST', '/api/transactions', 500, 450);

      const snapshot = metrics.getSnapshot();
      expect(snapshot.http.totalRequests).toBe(5);

      const getTransactions = snapshot.http.requestsByRoute['GET /api/transactions'];
      expect(getTransactions['2xx']).toBe(2);
      expect(getTransactions['4xx']).toBe(1);
      expect(getTransactions['5xx']).toBe(0);

      const postTransactions = snapshot.http.requestsByRoute['POST /api/transactions'];
      expect(postTransactions['2xx']).toBe(1);
      expect(postTransactions['5xx']).toBe(1);

      // Verify histogram
      const histogram = snapshot.http.durationHistogram['GET /api/transactions'];
      expect(histogram[25]).toBe(2); // 15ms and 5ms are <= 25
      expect(histogram[100]).toBe(1); // 80ms is <= 100
    });

    it('records AI generation tokens and latency metrics', () => {
      metrics.recordAiGeneration({
        model: 'gpt-4o',
        promptTokens: 250,
        completionTokens: 50,
        durationMs: 850,
      });

      metrics.recordAiGeneration({
        model: 'gpt-4o',
        promptTokens: 300,
        completionTokens: 100,
        durationMs: 1200,
      });

      const snapshot = metrics.getSnapshot();
      expect(snapshot.ai.totalRequests).toBe(2);
      expect(snapshot.ai.totalTokens.prompt).toBe(550);
      expect(snapshot.ai.totalTokens.completion).toBe(150);
      expect(snapshot.ai.totalTokens.total).toBe(700);

      expect(snapshot.ai.tokensByModel['gpt-4o'].total).toBe(700);
      expect(snapshot.ai.durationHistogram['gpt-4o'][1000]).toBe(1); // 850ms <= 1000
      expect(snapshot.ai.durationHistogram['gpt-4o'][2000]).toBe(1); // 1200ms <= 2000
    });

    it('records AI tool execution counts and errors', () => {
      metrics.recordAiToolExecution('add_transaction', false);
      metrics.recordAiToolExecution('add_transaction', false);
      metrics.recordAiToolExecution('add_transaction', true);
      metrics.recordAiToolExecution('query_finances', false);

      const snapshot = metrics.getSnapshot();
      expect(snapshot.ai.toolExecutions.add_transaction.count).toBe(3);
      expect(snapshot.ai.toolExecutions.add_transaction.errors).toBe(1);
      expect(snapshot.ai.toolExecutions.query_finances.count).toBe(1);
      expect(snapshot.ai.toolExecutions.query_finances.errors).toBe(0);
    });

    it('records D1 database batch metrics', () => {
      metrics.recordD1Batch(3, 40);
      metrics.recordD1Batch(2, 65);

      const snapshot = metrics.getSnapshot();
      expect(snapshot.database.totalBatches).toBe(2);
      expect(snapshot.database.totalStatements).toBe(5);
      expect(snapshot.database.durationHistogram[50]).toBe(1);
      expect(snapshot.database.durationHistogram[100]).toBe(1);
    });
  });

  describe('Correlation & Request Context in Elysia App', () => {
    it('generates X-Request-Id header when not supplied by client', async () => {
      const res = await app.handle(new Request('http://localhost/'));
      expect(res.status).toBe(200);

      const requestId = res.headers.get('x-request-id');
      expect(requestId).toBeDefined();
      expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('preserves client-provided X-Request-Id header', async () => {
      const clientReqId = 'custom-client-trace-12345';
      const res = await app.handle(
        new Request('http://localhost/', {
          headers: { 'x-request-id': clientReqId },
        }),
      );
      expect(res.status).toBe(200);

      const requestId = res.headers.get('x-request-id');
      expect(requestId).toBe(clientReqId);
    });

    it('exposes metrics snapshot on GET /metrics', async () => {
      metrics.recordHttpRequest('GET', '/', 200, 10);

      const res = await app.handle(new Request('http://localhost/metrics'));
      expect(res.status).toBe(200);

      const body = (await res.json()) as {
        http: { totalRequests: number };
        ai: { totalRequests: number };
        database: { totalBatches: number };
      };

      expect(body.http).toBeDefined();
      expect(body.http.totalRequests).toBeGreaterThanOrEqual(1);
      expect(body.ai).toBeDefined();
      expect(body.database).toBeDefined();
    });
  });
});
