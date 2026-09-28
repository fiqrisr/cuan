import type { RateLimitRecord, RateLimitStore } from './types';

export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitRecord>();
  private maxEntries: number;
  private cleanupInterval: number;
  private opsSinceCleanup = 0;

  constructor(maxEntries = 10_000, cleanupInterval = 100) {
    this.maxEntries = maxEntries;
    this.cleanupInterval = cleanupInterval;
  }

  public increment(key: string, windowMs: number): RateLimitRecord {
    const now = Date.now();
    this.opsSinceCleanup++;

    if (this.opsSinceCleanup >= this.cleanupInterval) {
      this.cleanup(now);
      this.opsSinceCleanup = 0;
    }

    const record = this.store.get(key);

    if (!record || now >= record.resetAt) {
      if (this.store.size >= this.maxEntries) {
        this.cleanup(now);
        if (this.store.size >= this.maxEntries) {
          const firstKey = this.store.keys().next().value;
          if (firstKey) this.store.delete(firstKey);
        }
      }

      const newRecord: RateLimitRecord = {
        count: 1,
        resetAt: now + windowMs,
      };
      this.store.set(key, newRecord);
      return newRecord;
    }

    record.count++;
    return record;
  }

  public cleanup(now = Date.now()): void {
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetAt) {
        this.store.delete(key);
      }
    }
  }

  public reset(): void {
    this.store.clear();
    this.opsSinceCleanup = 0;
  }

  public get size(): number {
    return this.store.size;
  }
}
