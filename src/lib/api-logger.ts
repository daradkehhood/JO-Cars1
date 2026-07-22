import prisma from './prisma';

interface LogEntry {
  method: string;
  path: string;
  statusCode: number;
  userId?: string;
  ip: string;
  userAgent?: string;
  duration: number;
}

const requestLog: Array<LogEntry & { timestamp: Date }> = [];
const MAX_LOG_SIZE = 10000;

export function logApiRequest(entry: LogEntry) {
  const record = { ...entry, timestamp: new Date() };
  requestLog.push(record);

  if (requestLog.length > MAX_LOG_SIZE) {
    requestLog.splice(0, requestLog.length - MAX_LOG_SIZE);
  }

  if (entry.statusCode >= 400 || entry.duration > 5000) {
    console.log(JSON.stringify({
      level: entry.statusCode >= 500 ? 'ERROR' : 'WARN',
      method: entry.method,
      path: entry.path,
      status: entry.statusCode,
      duration: `${entry.duration}ms`,
      ip: entry.ip,
      userId: entry.userId,
    }));
  }
}

export function getSecurityStats() {
  const now = Date.now();
  const last1h = requestLog.filter(r => now - r.timestamp.getTime() < 3600000);
  const last24h = requestLog.filter(r => now - r.timestamp.getTime() < 86400000);

  const errors4xx = last1h.filter(r => r.statusCode >= 400 && r.statusCode < 500).length;
  const errors5xx = last1h.filter(r => r.statusCode >= 500).length;
  const uniqueIPs = new Set(last24h.map(r => r.ip)).size;
  const totalRequests = last1h.length;

  const topIPs = last24h.reduce<Record<string, number>>((acc, r) => {
    acc[r.ip] = (acc[r.ip] || 0) + 1;
    return acc;
  }, {});
  const sortedIPs = Object.entries(topIPs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return {
    period: { last1h: last1h.length, last24h: last24h.length },
    errors: { '4xx': errors4xx, '5xx': errors5xx },
    uniqueIPs,
    totalRequests,
    topIPs: sortedIPs.map(([ip, count]) => ({ ip, count })),
    avgResponseTime: last1h.length > 0
      ? Math.round(last1h.reduce((s, r) => s + r.duration, 0) / last1h.length)
      : 0,
  };
}

export async function saveAuditLog(entry: {
  action: string;
  actorId?: string;
  description: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId || 'system',
        description: entry.description,
        entityType: entry.entityType || 'system',
        entityId: entry.entityId,
        ip: entry.ipAddress,
      },
    });
  } catch {}
}
