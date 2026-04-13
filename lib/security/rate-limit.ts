type RateLimitPolicy = {
  limit: number;
  windowMs: number;
  blockMs?: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
  blockedUntil: number;
};

type RateLimitStore = Map<string, RateLimitRecord>;

declare global {
  var __odoraRateLimitStore: RateLimitStore | undefined;
}

const rateLimitStore = globalThis.__odoraRateLimitStore ?? new Map<string, RateLimitRecord>();

if (!globalThis.__odoraRateLimitStore) {
  globalThis.__odoraRateLimitStore = rateLimitStore;
}

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.blockedUntil <= now && entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function consumeRateLimit(key: string, policy: RateLimitPolicy) {
  const now = Date.now();

  if (rateLimitStore.size > 2000) {
    pruneExpiredEntries(now);
  }

  const existing = rateLimitStore.get(key);
  const blockMs = policy.blockMs ?? policy.windowMs;

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + policy.windowMs,
      blockedUntil: 0,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (existing.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.blockedUntil - now) / 1000)),
    };
  }

  existing.count += 1;

  if (existing.count > policy.limit) {
    existing.blockedUntil = now + blockMs;
    rateLimitStore.set(key, existing);

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(blockMs / 1000)),
    };
  }

  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}
