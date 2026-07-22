const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
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
  AI: { windowMs: 60 * 1000, maxRequests: 10 },
  MESSAGE: { windowMs: 60 * 1000, maxRequests: 30 },
  GENERAL: { windowMs: 60 * 1000, maxRequests: 100 },
} as const;
