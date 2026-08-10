const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

// Synchronous check (Uses memory map, fast and reliable)
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: Math.ceil(config.windowMs / 1000) };
  }

  if (record.count >= config.maxRequests) {
    const resetIn = Math.ceil((record.resetTime - now) / 1000);
    console.log(JSON.stringify({
      level: 'SECURITY',
      action: 'RATE_LIMIT_EXCEEDED',
      key,
      count: record.count,
      maxRequests: config.maxRequests,
      resetIn: `${resetIn}s`,
    }));
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetIn: Math.ceil((record.resetTime - now) / 1000) };
}

// Async check (Support Redis via Upstash REST API or standard HTTP if configured, falls back to memory)
export async function checkRateLimitAsync(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const windowSec = Math.ceil(config.windowMs / 1000);
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', `rl:${key}`],
          ['EXPIRE', `rl:${key}`, windowSec, 'NX'],
          ['TTL', `rl:${key}`],
        ]),
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const data = await res.json();
        const count = data[0]?.result || 1;
        const ttl = data[2]?.result || windowSec;
        const allowed = count <= config.maxRequests;
        return {
          allowed,
          remaining: Math.max(0, config.maxRequests - count),
          resetIn: ttl > 0 ? ttl : windowSec,
        };
      }
    } catch (e) {
      // Fallback silently to memory
    }
  }

  return checkRateLimit(key, config);
}

export function resetRateLimit(key: string) {
  rateLimitMap.delete(key);
}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export const RATE_LIMITS = {
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  REGISTER: { windowMs: 15 * 60 * 1000, maxRequests: 3 },
  UPLOAD: { windowMs: 60 * 1000, maxRequests: 20 },
  AI: { windowMs: 60 * 1000, maxRequests: 30 },
  AI_CHAT: { windowMs: 60 * 1000, maxRequests: 20 },
  MESSAGE: { windowMs: 60 * 1000, maxRequests: 30 },
  FORUM: { windowMs: 60 * 1000, maxRequests: 10 },
  CONTACT: { windowMs: 60 * 1000, maxRequests: 5 },
  RATING: { windowMs: 60 * 1000, maxRequests: 10 },
  WANTED: { windowMs: 60 * 1000, maxRequests: 10 },
  CAR_CREATE: { windowMs: 60 * 1000, maxRequests: 5 },
  GENERAL: { windowMs: 60 * 1000, maxRequests: 200 },
} as const;

