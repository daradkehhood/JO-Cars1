const blockedIPs = new Map<string, { reason: string; expiresAt: number }>();
const suspiciousActivity = new Map<string, { count: number; firstSeen: number; lastSeen: number }>();

const BLOCK_DURATION = 60 * 60 * 1000; // 1 hour
const SUSPICIOUS_THRESHOLD = 50; // requests per minute
const AUTO_BLOCK_THRESHOLD = 100; // auto-block after this many suspicious requests

export function isIPBlocked(ip: string): boolean {
  const block = blockedIPs.get(ip);
  if (!block) return false;

  if (Date.now() > block.expiresAt) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}

export function blockIP(ip: string, reason: string, durationMs: number = BLOCK_DURATION) {
  blockedIPs.set(ip, {
    reason,
    expiresAt: Date.now() + durationMs,
  });
  console.log(JSON.stringify({ level: 'SECURITY', action: 'IP_BLOCKED', ip, reason }));
}

export function trackSuspiciousActivity(ip: string): boolean {
  const now = Date.now();
  const activity = suspiciousActivity.get(ip);

  if (!activity || now - activity.lastSeen > 60000) {
    suspiciousActivity.set(ip, { count: 1, firstSeen: now, lastSeen: now });
    return false;
  }

  activity.count++;
  activity.lastSeen = now;

  if (activity.count >= AUTO_BLOCK_THRESHOLD) {
    blockIP(ip, `Auto-blocked: ${activity.count} requests in 1 minute`);
    suspiciousActivity.delete(ip);
    return true;
  }

  return activity.count >= SUSPICIOUS_THRESHOLD;
}

export function cleanupBlockedIPs() {
  const now = Date.now();
  for (const [ip, block] of blockedIPs.entries()) {
    if (now > block.expiresAt) {
      blockedIPs.delete(ip);
    }
  }
  for (const [ip, activity] of suspiciousActivity.entries()) {
    if (now - activity.lastSeen > 120000) {
      suspiciousActivity.delete(ip);
    }
  }
}

export function getBlockedIPs() {
  const now = Date.now();
  const result: Array<{ ip: string; reason: string; expiresIn: number }> = [];
  for (const [ip, block] of blockedIPs.entries()) {
    if (now < block.expiresAt) {
      result.push({ ip, reason: block.reason, expiresIn: Math.ceil((block.expiresAt - now) / 1000) });
    }
  }
  return result;
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupBlockedIPs, 5 * 60 * 1000);
}
