import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const action = request.nextUrl.searchParams.get('action');
    const entityType = request.nextUrl.searchParams.get('entityType');
    const query = request.nextUrl.searchParams.get('q');
    const dateFrom = request.nextUrl.searchParams.get('dateFrom');
    const dateTo = request.nextUrl.searchParams.get('dateTo');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50'), 200);

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    if (query && query.trim()) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      const userIds = matchingUsers.map(u => u.id);
      if (userIds.length > 0) {
        where.actorId = { in: userIds };
      } else {
        return successResponse({
          logs: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: { select: { id: true, name: true, email: true, role: true, image: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return successResponse({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    return errorResponse('فشل تحميل السجل', 500);
  }
}
