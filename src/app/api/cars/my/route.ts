import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const where: Record<string, unknown> = { userId: user.id };
    if (status) where.status = status;
    const cars = await prisma.car.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: { brand: true, model: true, city: true, images: { take: 1, orderBy: { order: 'asc' } }, _count: { select: { favorites: true, messages: true, carViews: true } } },
    });
    return successResponse(cars);
  } catch { return errorResponse('فشل تحميل السيارات', 500); }
}
