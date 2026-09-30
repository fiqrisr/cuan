import { env } from '@/env';

export const isAllowedOrigin = (origin: string): boolean => {
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
  }
  if (env.FRONTEND_URL && origin === env.FRONTEND_URL) {
    return true;
  }
  return false;
};
