import { logger } from '@cuan/elysia-logger';
import { Elysia } from 'elysia';
import { AppError } from '../lib/error';

export const errorHandler = new Elysia({ name: 'error-handler' }).onError({ as: 'global' }, ctx => {
  const { code, error, set, request } = ctx;
  const requestId =
    'requestId' in ctx && typeof ctx.requestId === 'string' ? ctx.requestId : undefined;
  const log =
    'log' in ctx && ctx.log && typeof ctx.log === 'object' ? (ctx.log as typeof logger) : undefined;
  const headerReqId =
    requestId ||
    request?.headers?.get('x-request-id') ||
    (set?.headers ? (set.headers['x-request-id'] as string | undefined) : undefined) ||
    crypto.randomUUID();
  if (set?.headers && !set.headers['x-request-id']) {
    set.headers['x-request-id'] = headerReqId;
  }
  const reqLog = log || (headerReqId ? logger.child({ requestId: headerReqId }) : logger);
  const isDev = process.env.NODE_ENV !== 'production';
  const method = request?.method ?? 'UNKNOWN';
  const path = request?.url ? new URL(request.url).pathname : '';

  // If it's our custom AppError
  if (error instanceof AppError) {
    set.status = error.statusCode;

    if (error.statusCode >= 500) {
      reqLog.error(
        {
          event: 'app_server_error',
          method,
          path,
          status: error.statusCode,
          code: error.code || 'APP_ERROR',
          err: error,
        },
        error.message,
      );
    } else {
      reqLog.warn(
        {
          event: 'app_client_error',
          method,
          path,
          status: error.statusCode,
          code: error.code || 'APP_ERROR',
          details: error.details,
        },
        error.message,
      );
    }

    return {
      error: error.message,
      code: error.code || 'APP_ERROR',
      details: error.details,
    };
  }

  // Handle Elysia built-in validation errors
  if (code === 'VALIDATION') {
    set.status = 422;
    reqLog.warn(
      {
        event: 'validation_error',
        method,
        path,
        status: 422,
        code: 'VALIDATION_ERROR',
        details: error.all,
      },
      'Validation failed',
    );
    return {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.all,
    };
  }

  if (code === 'NOT_FOUND') {
    set.status = 404;
    reqLog.warn(
      {
        event: 'not_found',
        method,
        path,
        status: 404,
        code: 'NOT_FOUND',
      },
      'Route not found',
    );
    return {
      error: 'Route not found',
      code: 'NOT_FOUND',
    };
  }

  // Unhandled errors
  set.status = 500;

  // Log unexpected errors
  reqLog.error(
    {
      event: 'unhandled_error',
      method,
      path,
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      err: error,
    },
    'Unhandled exception occurred',
  );

  return {
    error: 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDev && error instanceof Error ? { stack: error.stack } : {}),
  };
});
