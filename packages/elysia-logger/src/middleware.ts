import { Elysia } from 'elysia';
import { logger as defaultLogger, type Logger } from './logger';
import { metrics as defaultMetrics, type MetricsRegistry } from './metrics';

export type RequestContextOptions = {
  logger?: Logger;
  metrics?: MetricsRegistry;
  headerName?: string;
};

export function createRequestContext(options: RequestContextOptions = {}) {
  const baseLogger = options.logger ?? defaultLogger;
  const metricsRegistry = options.metrics ?? defaultMetrics;
  const headerName = options.headerName ?? 'x-request-id';
  const completedRequests = new WeakSet<Request>();

  const recordHttpTransaction = (ctx: {
    request?: Request;
    set?: { status?: number | string; headers?: Record<string, string | number> };
    path?: string;
    startTime?: number;
    response?: unknown;
    requestId?: string;
    log?: Logger;
  }) => {
    const { request, set, path, startTime, response } = ctx;
    if (request && completedRequests.has(request)) {
      return;
    }
    if (request) {
      completedRequests.add(request);
    }

    let status = 200;
    if (response instanceof Response) {
      status = response.status;
    } else if (typeof set?.status === 'number') {
      status = set.status;
    } else if (typeof set?.status === 'string' && !Number.isNaN(Number(set.status))) {
      status = Number(set.status);
    }

    const durationMs = startTime !== undefined ? Math.round(performance.now() - startTime) : 0;
    const method = request?.method ?? 'GET';
    const route = path || (request?.url ? new URL(request.url).pathname : '/');

    metricsRegistry.recordHttpRequest(method, route, status, durationMs);

    const requestId =
      ctx.requestId ||
      request?.headers?.get(headerName) ||
      (set?.headers ? (set.headers[headerName] as string | undefined) : undefined) ||
      crypto.randomUUID();

    if (set?.headers && !set.headers[headerName]) {
      set.headers[headerName] = requestId;
    }

    const logData = {
      event: 'http_request',
      method,
      path: route,
      status,
      durationMs,
    };

    const reqLog = ctx.log || (requestId ? baseLogger.child({ requestId }) : baseLogger);

    const message = `${method} ${route} ${status} ${durationMs}ms`;

    if (status >= 500) {
      reqLog.error(logData, message);
    } else if (status >= 400) {
      reqLog.warn(logData, message);
    } else {
      reqLog.info(logData, message);
    }
  };

  return new Elysia({ name: 'request-context' })
    .derive({ as: 'global' }, ({ request, set }) => {
      const existingReqId = request.headers.get(headerName);
      const requestId = existingReqId || crypto.randomUUID();
      set.headers[headerName] = requestId;
      try {
        request.headers.set(headerName, requestId);
      } catch {
        // Headers may be immutable in some runtimes
      }

      const startTime = performance.now();
      const log = baseLogger.child({ requestId });

      return {
        requestId,
        startTime,
        log,
      };
    })
    .mapResponse({ as: 'global' }, ctx => {
      recordHttpTransaction(ctx);
    })
    .onAfterResponse({ as: 'global' }, ctx => {
      recordHttpTransaction(ctx);
    });
}

export const requestContext = createRequestContext();
