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

  return new Elysia({ name: 'request-context' })
    .derive({ as: 'global' }, ({ request, set }) => {
      const existingReqId = request.headers.get(headerName);
      const requestId = existingReqId || crypto.randomUUID();
      set.headers[headerName] = requestId;

      const startTime = performance.now();
      const log = baseLogger.child({ requestId });

      return {
        requestId,
        startTime,
        log,
      };
    })
    .onAfterResponse({ as: 'global' }, ({ request, set, path, startTime, log }) => {
      const durationMs = startTime !== undefined ? Math.round(performance.now() - startTime) : 0;
      const status = typeof set.status === 'number' ? set.status : 200;
      const method = request.method;
      const route = path || new URL(request.url).pathname;

      metricsRegistry.recordHttpRequest(method, route, status, durationMs);

      const logData = {
        event: 'http_request',
        method,
        path: route,
        status,
        durationMs,
      };

      const reqLog = log || baseLogger;
      const message = `${method} ${route} ${status} ${durationMs}ms`;

      if (status >= 500) {
        reqLog.error(logData, message);
      } else if (status >= 400) {
        reqLog.warn(logData, message);
      } else {
        reqLog.info(logData, message);
      }
    });
}

export const requestContext = createRequestContext();
