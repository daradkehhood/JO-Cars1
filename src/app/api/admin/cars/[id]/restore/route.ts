import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  try {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return notFoundResponse('السيارة');
    if (!car.deletedAt) return errorResponse('السيارة غير محذوفة', 400);
    const updated = await prisma.car.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null, status: 'APPROVED' },
    });
    await prisma.carLog.create({ data: { carId: id, userId: user.id, action: 'RESTORED' } });
    return successResponse(updated);
  } catch { return errorResponse('فشل استعادة السيارة', 500); }
}
