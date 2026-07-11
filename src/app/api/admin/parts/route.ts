import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const status = request.nextUrl.searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const parts = await prisma.usedPart.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        brand: { select: { nameAr: true } },
      },
    });
    return successResponse(parts);
  } catch {
    return errorResponse('فشل تحميل القطع', 500);
  }
}
