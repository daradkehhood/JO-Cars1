import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const status = request.nextUrl.searchParams.get('status');
    const search = request.nextUrl.searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    if (search.trim()) {
      where.OR = [
        { refCode: { contains: search.trim() } },
        { user: { name: { contains: search.trim() } } },
        { user: { email: { contains: search.trim() } } },
        { user: { dealerName: { contains: search.trim() } } },
      ];
    }

    const cars = await prisma.car.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        user: { select: { id: true, name: true, email: true, dealerName: true } },
        images: { take: 1 },
      },
    });
    return successResponse(cars);
  } catch (error) {
    return errorResponse('فشل تحميل السيارات', 500);
  }
}
