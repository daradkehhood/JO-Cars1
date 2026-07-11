import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { carId, type } = body;

    if (!carId || !type || !['FEATURE', 'PIN'].includes(type)) {
      return errorResponse('بيانات غير صالحة');
    }

    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) return errorResponse('السيارة غير موجودة', 404);
    if (car.userId !== user.id) return errorResponse('هذه ليست سيارتك');

    const existingPending = await prisma.premiumRequest.findFirst({
      where: { carId, userId: user.id, status: 'PENDING' },
    });

    if (existingPending) return errorResponse('لديك طلب معلق لهذه السيارة');

    const premiumRequest = await prisma.premiumRequest.create({
      data: { carId, userId: user.id, type },
    });

    return successResponse(premiumRequest);
  } catch (error) {
    return errorResponse('فشل إنشاء الطلب', 500);
  }
}

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const requests = await prisma.premiumRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        car: {
          select: {
            id: true, slug: true, price: true, year: true,
            brand: { select: { nameAr: true } },
            model: { select: { nameAr: true } },
          },
        },
      },
    });

    return successResponse(requests);
  } catch (error) {
    return errorResponse('فشل تحميل الطلبات', 500);
  }
}
