import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { checkPriceAlerts } from '@/lib/check-price-alerts';
import { calculateFairPrice } from '@/lib/fair-price';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();
  try {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return notFoundResponse('السيارة');
    if (car.userId !== user.id && user.role !== 'ADMIN') return errorResponse('لا تملك صلاحية', 403);
    if (car.status !== 'SOLD') return errorResponse('السيارة ليست مباعة', 400);
    if (car.deletedAt) return errorResponse('السيارة محذوفة', 400);
    const updated = await prisma.car.update({
      where: { id },
      data: { status: 'APPROVED', soldAt: null },
    });
    await prisma.carLog.create({ data: { carId: id, userId: user.id, action: 'REACTIVATED' } });
    checkPriceAlerts(id).catch(() => {});
    calculateFairPrice(id).catch(() => {});
    return successResponse(updated);
  } catch { return errorResponse('فشل إعادة التفعيل', 500); }
}
