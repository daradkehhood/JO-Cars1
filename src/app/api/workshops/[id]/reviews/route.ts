import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');

    const [reviews, total] = await Promise.all([
      prisma.workshopReview.findMany({
        where: { workshopId: id, isHidden: false },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workshopReview.count({ where: { workshopId: id, isHidden: false } }),
    ]);

    return successResponse({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return errorResponse('فشل تحميل التقييمات', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');

    const {
      carMake, carModel, carYear, repairType, price, duration,
      description, beforeImage, afterImage,
      qualityRating, priceRating, speedRating, serviceRating,
      cleanlinessRating, punctualityRating, partsRating, recommend,
    } = body;

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.workshopReview.create({
        data: {
          workshopId: id,
          userId: user.id,
          carMake: carMake || null,
          carModel: carModel || null,
          carYear: carYear || null,
          repairType: repairType || null,
          price: price || null,
          duration: duration || null,
          description: description || null,
          beforeImage: beforeImage || null,
          afterImage: afterImage || null,
          qualityRating: qualityRating || null,
          priceRating: priceRating || null,
          speedRating: speedRating || null,
          serviceRating: serviceRating || null,
          cleanlinessRating: cleanlinessRating || null,
          punctualityRating: punctualityRating || null,
          partsRating: partsRating || null,
          recommend: recommend !== false,
        },
      });

      const allReviews = await tx.workshopReview.findMany({
        where: { workshopId: id, isHidden: false },
        select: {
          qualityRating: true,
          priceRating: true,
          speedRating: true,
          serviceRating: true,
          cleanlinessRating: true,
          punctualityRating: true,
          partsRating: true,
          recommend: true,
        },
      });

      const totalRatingSum = allReviews.reduce((sum, r) => {
        const ratings = [r.qualityRating, r.priceRating, r.speedRating, r.serviceRating, r.cleanlinessRating, r.punctualityRating, r.partsRating].filter((x): x is number => x != null);
        if (ratings.length === 0) return sum;
        return sum + ratings.reduce((a, b) => a + b, 0) / ratings.length;
      }, 0);

      const reviewsWithRatings = allReviews.filter(r => {
        const ratings = [r.qualityRating, r.priceRating, r.speedRating, r.serviceRating, r.cleanlinessRating, r.punctualityRating, r.partsRating].filter((x): x is number => x != null);
        return ratings.length > 0;
      });

      const avgRating = reviewsWithRatings.length > 0 ? totalRatingSum / reviewsWithRatings.length : 0;
      const recommendCount = allReviews.filter(r => r.recommend).length;
      const recommendPercent = allReviews.length > 0 ? (recommendCount / allReviews.length) * 100 : 0;

      await tx.workshop.update({
        where: { id },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: allReviews.length,
          recommendPercent: Math.round(recommendPercent * 10) / 10,
          carFixedCount: { increment: 1 },
        },
      });

      return newReview;
    });

    return successResponse(review, 201);
  } catch (error) {
    console.error('Review creation error:', error);
    return errorResponse('فشل إنشاء التقييم', 500);
  }
}
