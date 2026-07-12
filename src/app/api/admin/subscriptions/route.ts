import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const search = request.nextUrl.searchParams.get('search');
    const status = request.nextUrl.searchParams.get('status');
    const plan = request.nextUrl.searchParams.get('plan');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 100);

    const where: any = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    if (search && search.trim()) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      const userIds = matchingUsers.map(u => u.id);
      if (userIds.length > 0) {
        where.userId = { in: userIds };
      } else {
        return successResponse({ subscriptions: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return successResponse({
      subscriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Subscriptions error:', error);
    return errorResponse('فشل تحميل الاشتراكات', 500);
  }
}
