import logixlysia from 'logixlysia';
import { env } from './env';

export const loggerMiddleware = logixlysia({
  config: {
    ip: true,
    // customLogFormat: '🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip}',
    pino: {
      level: env.NODE_ENV === 'development' ? 'debug' : 'info',
      redact: env.NODE_ENV === 'production' ? ['password', 'token'] : [],
      prettyPrint: env.NODE_ENV === 'development',
    },
  },
});
