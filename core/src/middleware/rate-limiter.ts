import {
  createRateLimiter as createGenericRateLimiter,
  getClientIp,
  MemoryRateLimitStore,
  type RateLimitRecord,
  type RateLimitStore,
  type RateLimitTierConfig,
} from '@cuan/elysia-rate-limiter';

export type RateLimitTier = 'auth' | 'chat' | 'api';

export type AppRateLimiterOptions = {
  auth?: RateLimitTierConfig;
  chat?: RateLimitTierConfig;
  api?: RateLimitTierConfig;
  skip?: (request: Request) => boolean;
  maxEntries?: number;
  cleanupInterval?: number;
  store?: MemoryRateLimitStore;
};

export const DEFAULT_RATE_LIMITS: Record<RateLimitTier, RateLimitTierConfig> = {
  auth: { max: 20, windowMs: 60_000 },
  chat: { max: 20, windowMs: 60_000 },
  api: { max: 100, windowMs: 60_000 },
};

export function resolveRateLimitTier(request: Request): RateLimitTier | null {
  if (request.method === 'OPTIONS') {
    return null;
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip system metadata and health routes
  if (pathname === '/' || pathname === '/health' || pathname === '/metrics') {
    return null;
  }

  // Auth tier: mutation endpoints (sign-in, sign-up, password reset, etc.)
  if (pathname.startsWith('/auth')) {
    if (
      request.method === 'POST' ||
      pathname.includes('sign-in') ||
      pathname.includes('sign-up') ||
      pathname.includes('reset-password')
    ) {
      return 'auth';
    }
    // Read-only session checks fall back to general api tier
    return 'api';
  }

  // AI Chat tier: expensive LLM tool calling endpoints
  if (pathname.startsWith('/api/chat')) {
    return 'chat';
  }

  // General API tier
  if (pathname.startsWith('/api')) {
    return 'api';
  }

  return 'api';
}

export function createRateLimiter(options?: AppRateLimiterOptions) {
  const limits: Record<RateLimitTier, RateLimitTierConfig> = {
    auth: options?.auth ?? DEFAULT_RATE_LIMITS.auth,
    chat: options?.chat ?? DEFAULT_RATE_LIMITS.chat,
    api: options?.api ?? DEFAULT_RATE_LIMITS.api,
  };

  return createGenericRateLimiter<RateLimitTier>({
    limits,
    defaultLimit: limits.api,
    resolveTier: resolveRateLimitTier,
    skip: options?.skip,
    store: options?.store,
    maxEntries: options?.maxEntries,
    cleanupInterval: options?.cleanupInterval,
  });
}

export const rateLimitStore = new MemoryRateLimitStore();
export const rateLimiter = createRateLimiter({ store: rateLimitStore });

export {
  getClientIp,
  MemoryRateLimitStore,
  type RateLimitRecord,
  type RateLimitStore,
  type RateLimitTierConfig,
};
