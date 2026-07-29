/**
 * AI Chat Response Cache — caches repeated questions to reduce NVIDIA API calls.
 * Uses a hash-based key from the normalized query + context.
 */

import crypto from 'crypto';

interface CacheEntry {
  response: string;
  timestamp: number;
  hitCount: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 500;

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a stable cache key from the user query and conversation context.
 * Strips timestamps, session IDs, and volatile context.
 */
export function generateCacheKey(query: string, intent: string): string {
  // Normalize query: lowercase, remove extra spaces, strip non-alphanumeric Arabic
  const normalized = query
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const key = `${intent}::${normalized}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

/**
 * Get a cached response if available and not expired.
 */
export function getCachedResponse(query: string, intent: string): string | null {
  // Don't cache ref_code lookups (dynamic data)
  if (intent === 'ref_code') return null;

  const key = generateCacheKey(query, intent);
  const entry = cache.get(key);

  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  entry.hitCount++;
  console.log(`[AI Cache] HIT for key=${key.slice(0, 8)}... (hits: ${entry.hitCount}, age: ${Math.round(age / 1000)}s)`);
  return entry.response;
}

/**
 * Store a response in cache.
 */
export function setCachedResponse(query: string, intent: string, response: string): void {
  // Don't cache ref_code or very short responses
  if (intent === 'ref_code') return;
  if (!response || response.length < 20) return;

  // Evict oldest entries if at capacity
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = [...cache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) cache.delete(oldest[0]);
  }

  const key = generateCacheKey(query, intent);
  cache.set(key, {
    response,
    timestamp: Date.now(),
    hitCount: 0,
  });
  console.log(`[AI Cache] STORE key=${key.slice(0, 8)}... (cache size: ${cache.size})`);
}

/**
 * Get cache stats for monitoring.
 */
export function getCacheStats(): { size: number; hitRate: string } {
  let totalHits = 0;
  for (const entry of cache.values()) {
    totalHits += entry.hitCount;
  }
  return {
    size: cache.size,
    hitRate: `${totalHits} total hits`,
  };
}
