'use client';

/**
 * fetchWithRetry — robust client-side fetch wrapper for slow / unstable mobile
 * networks. Adds per-attempt timeout (via AbortController) and exponential
 * backoff so a single dropped packet doesn't surface as "no internet" to the
 * user.
 *
 * Used by the car detail page to replace a one-shot `fetch` that would render
 * a blank page on flaky cellular connections.
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  attempts = 3,
  timeoutMs = 12000
): Promise<T> {
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(timer);
      // Success: 2xx
      if (res.ok) return (await res.json()) as T;
      // 5xx / network error → retry with backoff (but not the final attempt)
      if (res.status >= 500 && i < attempts - 1) {
        await backoff(i);
        continue;
      }
      // 4xx or last-attempt server error → parse body for caller to handle
      return (await res.json().catch(() => null)) as T;
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
      // AbortError / TypeError (network) → retry with backoff unless last attempt
      if (i < attempts - 1) {
        await backoff(i);
        continue;
      }
      throw e;
    }
  }
  throw lastError ?? new Error('fetch failed after retries');
}

function backoff(attempt: number): Promise<void> {
  const delay = 800 * (attempt + 1); // 800ms, 1600ms, 2400ms…
  return new Promise((resolve) => setTimeout(resolve, delay));
}
