import { Elysia } from 'elysia';
import { AppError } from '../lib/error';
import { logger } from './logger';

export const errorHandler = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ code, error, set, request }) => {
    // If it's our custom AppError
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        error: error.message,
        code: error.code || 'APP_ERROR',
        details: error.details,
      };
    }

    // Handle Elysia built-in validation errors
    if (code === 'VALIDATION') {
      set.status = 422;
      return {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.all,
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        error: 'Route not found',
        code: 'NOT_FOUND',
      };
    }

    // Unhandled errors
    set.status = 500;

    // Log unexpected errors
    const isDev = process.env.NODE_ENV !== 'production';
    logger.error(
      { event: 'unhandled_error', method: request.method, url: request.url, err: error },
      'Unhandled exception occurred',
    );

    return {
      error: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(isDev && error instanceof Error ? { stack: error.stack } : {}),
    };
  },
);
