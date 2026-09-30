export type RateLimitTierConfig = {
  max: number;
  windowMs: number;
};

export type RateLimitRecord = {
  count: number;
  resetAt: number;
};

export type RateLimitStore = {
  increment(key: string, windowMs: number): RateLimitRecord;
  cleanup?(now?: number): void;
  reset?(): void;
  size?: number;
};

export type RateLimiterOptions<Tiers extends string = string> = {
  limits?: Partial<Record<Tiers, RateLimitTierConfig>>;
  defaultLimit?: RateLimitTierConfig;
  resolveTier?: (request: Request) => Tiers | null;
  keyGenerator?: (request: Request, tier: Tiers) => string;
  skip?: (request: Request) => boolean;
  store?: RateLimitStore;
  maxEntries?: number;
  cleanupInterval?: number;
  customErrorMessage?: (tier: Tiers, retryAfter: number) => string;
  isAllowedOrigin?: (origin: string) => boolean;
};
