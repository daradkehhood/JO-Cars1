import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const reviews = await prisma.workshopReview.findMany({
      where: { workshopId: workshop.id },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = reviews.map((r) => {
      const ratings = [
        r.qualityRating,
        r.priceRating,
        r.speedRating,
        r.serviceRating,
        r.cleanlinessRating,
        r.punctualityRating,
        r.partsRating,
      ].filter((v): v is number => v !== null && v !== undefined);

      const avgRating = ratings.length > 0
        ? Math.round(ratings.reduce((sum, v) => sum + v, 0) / ratings.length)
        : 0;

      return {
        id: r.id,
        userName: r.user?.name || '',
        userAvatar: r.user?.image || null,
        carBrand: r.carMake || '',
        carModel: r.carModel || '',
        repairType: r.repairType || '',
        rating: avgRating,
        description: r.description || '',
        createdAt: r.createdAt.toISOString(),
        workshopReply: r.workshopReply || null,
      };
    });

    return successResponse(mapped);
  } catch (error) {
    console.error('Reviews list error:', error);
    return errorResponse('فشل تحميل التقييمات', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const body = await request.json();
    const { reviewId, workshopReply } = body;

    if (!reviewId) {
      return errorResponse('معرف التقييم مطلوب');
    }

    const review = await prisma.workshopReview.findFirst({
      where: { id: reviewId, workshopId: workshop.id },
    });
    if (!review) return notFoundResponse('التقييم');

    const updated = await prisma.workshopReview.update({
      where: { id: reviewId },
      data: {
        workshopReply,
        repliedAt: new Date(),
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Review reply error:', error);
    return errorResponse('فشل إضافة الرد', 500);
  }
}
