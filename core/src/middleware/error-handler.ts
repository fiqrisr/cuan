import { Elysia } from 'elysia';
import { AppError } from '../lib/error';
import { logger } from '../lib/logger';

export const errorHandler = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ code, error, set, request }) => {
    const headerReqId = request?.headers?.get('x-request-id');
    const reqLog = headerReqId ? logger.child({ requestId: headerReqId }) : logger;
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
  },
);
