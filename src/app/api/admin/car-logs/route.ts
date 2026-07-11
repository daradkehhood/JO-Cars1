import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    const logs = await prisma.carLog.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { id: true, name: true, email: true } }, car: { select: { id: true, slug: true, brandId: true, modelId: true, year: true } } },
    });
    return successResponse(logs);
  } catch { return errorResponse('فشل تحميل السجل', 500); }
}
