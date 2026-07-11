import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        isActive: true, canPost: true, banStatus: true, banReason: true,
        banUntil: true, lastLoginAt: true, lastLoginIp: true,
        dealerName: true, rating: true, createdAt: true,
        badges: true,
        _count: { select: { cars: true } },
      },
    });

    return successResponse(users);
  } catch (error) {
    return errorResponse('فشل تحميل المستخدمين', 500);
  }
}
