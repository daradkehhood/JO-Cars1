import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

const NodeCache = require('../lib/cache');

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
  const cached = NodeCache.get(key);
  if (cached !== null) return cached as T;
  const data = await fetcher();
  NodeCache.set(key, data, ttlMs);
  return data;
}

export function invalidateCache(prefix: string) {
  NodeCache.delPattern(prefix);
}
