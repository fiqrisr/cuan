import { Elysia } from 'elysia';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export const requestContext = new Elysia({ name: 'request-context' })
  .derive({ as: 'global' }, ({ request, set }) => {
    const existingReqId = request.headers.get('x-request-id');
    const requestId = existingReqId || crypto.randomUUID();
    set.headers['x-request-id'] = requestId;

    const startTime = performance.now();
    const log = logger.child({ requestId });

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

    // Record RED metrics
    metrics.recordHttpRequest(method, route, status, durationMs);

    const logData = {
      event: 'http_request',
      method,
      path: route,
      status,
      durationMs,
    };

    const reqLog = log || logger;
    const message = `${method} ${route} ${status} ${durationMs}ms`;

    if (status >= 500) {
      reqLog.error(logData, message);
    } else if (status >= 400) {
      reqLog.warn(logData, message);
    } else {
      reqLog.info(logData, message);
    }
  });
