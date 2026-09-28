import type { App } from '@cuan/core/src/app'; // Make sure this is exported from core/src/app.ts
import { treaty } from '@elysiajs/eden';
import { generateRequestId, HEADER_REQUEST_ID, telemetry } from '../telemetry';
import { API_BASE_URL } from './base-url';
import { handleUnauthorized } from './unauthorized';

export { API_BASE_URL } from './base-url';

// @ts-expect-error
export const api = treaty<App>(API_BASE_URL, {
  fetch: {
    credentials: 'include',
  },
  onRequest: (path: string, options: RequestInit) => {
    let requestId: string | null = null;

    if (options.headers instanceof Headers) {
      requestId = options.headers.get(HEADER_REQUEST_ID);
      if (!requestId) {
        requestId = generateRequestId();
        options.headers.set(HEADER_REQUEST_ID, requestId);
      }
    } else {
      const headersRecord: Record<string, string> = Array.isArray(options.headers)
        ? Object.fromEntries(options.headers)
        : (options.headers as Record<string, string>) || {};

      requestId = headersRecord[HEADER_REQUEST_ID] || headersRecord['x-request-id'] || null;
      if (!requestId) {
        requestId = generateRequestId();
        headersRecord[HEADER_REQUEST_ID] = requestId;
      }
      options.headers = headersRecord;
    }
    telemetry.addBreadcrumb({
      category: 'http',
      message: `${options.method ?? 'GET'} ${path}`,
      data: { requestId },
      level: 'info',
    });
  },
  onResponse: (response: Response) => {
    const requestId = response.headers.get(HEADER_REQUEST_ID) ?? undefined;
    if (!response.ok) {
      telemetry.recordEvent(
        'http_request_failed',
        {
          status: response.status,
          url: response.url,
          requestId,
        },
        response.status >= 500 ? 'error' : 'warn',
        requestId,
      );
    }
    handleUnauthorized(response);
  },
});
