import { Elysia } from 'elysia';
import { getClientIp } from './ip';
import { MemoryRateLimitStore } from './store';
import type { RateLimiterOptions, RateLimitTierConfig } from './types';

const FALLBACK_LIMIT: RateLimitTierConfig = {
  max: 60,
  windowMs: 60_000,
};

export function createRateLimiter<Tiers extends string = string>(
  options?: RateLimiterOptions<Tiers>,
) {
  const store =
    options?.store ?? new MemoryRateLimitStore(options?.maxEntries, options?.cleanupInterval);
  const limits = options?.limits;
  const defaultLimit = options?.defaultLimit ?? FALLBACK_LIMIT;

  return new Elysia({ name: 'rate-limiter' }).onRequest(({ request, set }) => {
    if (request.method === 'OPTIONS') {
      return;
    }

    if (options?.skip?.(request)) {
      return;
    }

    const tier = options?.resolveTier ? options.resolveTier(request) : ('default' as Tiers);
    if (!tier) {
      return;
    }

    const tierConfig: RateLimitTierConfig = limits?.[tier] ?? defaultLimit;
    const key = options?.keyGenerator
      ? options.keyGenerator(request, tier)
      : `${tier}:${getClientIp(request)}`;

    const { count, resetAt } = store.increment(key, tierConfig.windowMs);
    const now = Date.now();
    const resetSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
    const remaining = Math.max(0, tierConfig.max - count);

    set.headers['RateLimit-Limit'] = String(tierConfig.max);
    set.headers['RateLimit-Remaining'] = String(remaining);
    set.headers['RateLimit-Reset'] = String(resetSeconds);
    set.headers['X-RateLimit-Limit'] = String(tierConfig.max);
    set.headers['X-RateLimit-Remaining'] = String(remaining);
    set.headers['X-RateLimit-Reset'] = String(resetSeconds);

    if (count > tierConfig.max) {
      set.headers['Retry-After'] = String(resetSeconds);

      const origin = request.headers.get('origin');
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Retry-After': String(resetSeconds),
        'RateLimit-Limit': String(tierConfig.max),
        'RateLimit-Remaining': '0',
        'RateLimit-Reset': String(resetSeconds),
        'X-RateLimit-Limit': String(tierConfig.max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetSeconds),
      });

      const isOriginAllowed = origin
        ? options?.isAllowedOrigin
          ? options.isAllowedOrigin(origin)
          : true
        : false;
      if (origin && isOriginAllowed) {
        headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Access-Control-Allow-Credentials', 'true');
        headers.set('Vary', 'Origin');
      }

      const errorMessage = options?.customErrorMessage
        ? options.customErrorMessage(tier, resetSeconds)
        : `Too many requests for ${tier} endpoint. Please try again in ${resetSeconds} seconds.`;

      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          message: errorMessage,
          details: {
            tier,
            limit: tierConfig.max,
            windowMs: tierConfig.windowMs,
            retryAfter: resetSeconds,
          },
        }),
        {
          status: 429,
          headers,
        },
      );
    }
  });
}
