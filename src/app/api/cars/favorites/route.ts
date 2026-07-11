import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        car: {
          include: {
            brand: true, model: true, city: true,
            images: { take: 1, orderBy: { order: 'asc' } },
            user: { select: { id: true, name: true, dealerName: true } },
          },
        },
      },
      orderBy: { car: { createdAt: 'desc' } },
    });

    return successResponse(favorites.map(f => f.car));
  } catch (error) {
    console.error('Favorites fetch error:', error);
    return errorResponse('فشل تحميل المفضلة', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { carId } = await request.json();
    const existing = await prisma.favorite.findUnique({
      where: { carId_userId: { carId, userId: user.id } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      await prisma.car.update({ where: { id: carId }, data: { saves: { decrement: 1 } } });
      return successResponse({ saved: false });
    } else {
      await prisma.favorite.create({ data: { carId, userId: user.id } });
      await prisma.car.update({ where: { id: carId }, data: { saves: { increment: 1 } } });
      return successResponse({ saved: true }, 201);
    }
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return errorResponse('فشل تحديث المفضلة', 500);
  }
}
