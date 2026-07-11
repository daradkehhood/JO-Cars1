import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  try {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return notFoundResponse('السيارة');
    await prisma.carLog.create({ data: { carId: id, userId: user.id, action: 'PERMANENTLY_DELETED' } });
    await prisma.car.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch { return errorResponse('فشل الحذف النهائي', 500); }
}
