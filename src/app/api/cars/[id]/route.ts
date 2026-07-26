import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: carId } = await params;
  const user = await authenticateRequest(request).catch(() => null);
  try {
    const trackView = request.nextUrl.searchParams.get('trackView') === 'true';

    const car = await prisma.car.findFirst({
      where: { OR: [{ id: carId }, { slug: carId }] },
      include: {
        brand: true,
        model: true,
        city: true,
        // Cap images at 15 — most listings have ≤ 12, and downloading the full
        // set on a slow mobile connection caused the "no internet" page.
        images: { orderBy: { order: 'asc' }, take: 15 },
        user: {
          select: {
            id: true, name: true, phone: true, whatsapp: true,
            image: true, dealerName: true, dealerLogo: true, dealerDescription: true,
            dealerAddress: true, dealerVerified: true, rating: true,
            ratingCount: true, createdAt: true, badges: true,
          },
        },
      },
    });

    if (!car) return notFoundResponse('السيارة');

    // Fire-and-forget view increment — doesn't block the response. On flaky
    // mobile networks awaiting this serial write often stalled the whole page.
    if (trackView) {
      prisma.car
        .update({ where: { id: car.id }, data: { views: { increment: 1 } } })
        .catch(() => {});
    }

    let isFavorited = false;
    if (user) {
      try {
        const fav = await prisma.favorite.findUnique({
          where: { carId_userId: { carId: car.id, userId: user.id } },
        });
        isFavorited = !!fav;
      } catch { /* ignore */ }
    }

    return successResponse({ ...car, views: trackView ? car.views + 1 : car.views, isFavorited });
  } catch (error) {
    console.error('Car fetch error:', error);
    return errorResponse('فشل تحميل السيارة', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return notFoundResponse('السيارة');
    if (car.userId !== user.id && user.role !== 'ADMIN') return errorResponse('لا تملك صلاحية تعديل هذه السيارة', 403);

    const body = await request.json();
    const allowedFields = [
      'title', 'description', 'price', 'brandId', 'modelId', 'year', 'km',
      'fuelType', 'transmission', 'bodyType', 'color', 'engineSize', 'cylinders',
      'cityId', 'locationLat', 'locationLng', 'phone', 'whatsapp', 'slug',
      'status', 'featured', 'featuredUntil', 'soldAt',
    ];
    const safeData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) safeData[key] = body[key];
    }

    const updated = await prisma.car.update({
      where: { id },
      data: safeData,
      include: { brand: true, model: true, city: true, images: true },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Car update error:', error);
    return errorResponse('فشل تحديث السيارة', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return notFoundResponse('السيارة');
    if (user.role !== 'ADMIN') return errorResponse('المدير فقط يمكنه حذف الإعلانات', 403);
    if (car.deletedAt) return errorResponse('السيارة محذوفة بالفعل', 400);

    await prisma.car.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: user.role === 'ADMIN' ? 'ADMIN' : 'USER' } });
    await prisma.carLog.create({ data: { carId: id, userId: user.id, action: 'SOFT_DELETED' } });
    return successResponse({ deleted: true, soft: true });
  } catch (error) {
    console.error('Car delete error:', error);
    return errorResponse('فشل حذف السيارة', 500);
  }
}
