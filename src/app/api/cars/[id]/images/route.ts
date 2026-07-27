import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api';

/**
 * Lazy-load additional images for a car listing.
 * The main /api/cars/[id] endpoint returns only 6 images to keep the payload
 * small on mobile. This endpoint loads the rest on demand.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: carId } = await params;
  try {
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '6', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
    const safeLimit = Math.min(Math.max(limit, 1), 30);

    const car = await prisma.car.findFirst({
      where: { OR: [{ id: carId }, { slug: carId }], deletedAt: null },
      select: { id: true },
    });

    if (!car) return notFoundResponse('السيارة');

    const images = await prisma.carImage.findMany({
      where: { carId: car.id },
      orderBy: { order: 'asc' },
      skip: offset,
      take: safeLimit,
      select: { id: true, url: true, isCover: true, order: true },
    });

    return successResponse({ images, hasMore: images.length === safeLimit });
  } catch (error) {
    console.error('Car images fetch error:', error);
    return errorResponse('فشل تحميل الصور', 500);
  }
}
