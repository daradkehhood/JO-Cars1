import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse, errorResponse, unauthorizedResponse, notFoundResponse,
} from '@/lib/api';

/**
 * Public car-reviews endpoint.
 *
 *   GET  /api/cars/[id]/reviews?page=&limit=
 *       -> paginated review list (only non-hidden), includes dealer reply
 *          + reviewer info + aggregated average shown via Car itself elsewhere.
 *
 *   POST /api/cars/[id]/reviews
 *       body: { bookingId, rating (1-5), comment?, carConditionRating?,
 *              descriptionAccuracy?, valueForMoney?, dealerExperience? }
 *       -> only allowed if the caller is the buyer on a booking whose status
 *          is COMPLETED and they don't already have a review (one review per
 *          buyer per car, enforced via @@unique([carId, userId])).
 *       -> runs inside a $transaction that re-computes the Car's average
 *          rating and counter after the insert (clones the WorkshopReview
 *          pattern in workshops/[id]/reviews/route.ts).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: carId } = await params;
    const car = await prisma.car.findFirst({ where: { OR: [{ id: carId }, { slug: carId }] }, select: { id: true } });
    if (!car) return notFoundResponse('السيارة');
    const realCarId = car.id;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.carReview.findMany({
        where: { carId: realCarId, isHidden: false },
        include: {
          user: { select: { id: true, name: true, image: true } },
          target: { select: { id: true, name: true, dealerName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.carReview.count({ where: { carId: realCarId, isHidden: false } }),
    ]);

    return successResponse({
      reviews,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('car reviews GET error:', error);
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
    const { id: carId } = await params;
    const car = await prisma.car.findFirst({
      where: { OR: [{ id: carId }, { slug: carId }] },
      select: { id: true, userId: true },
    });
    if (!car) return notFoundResponse('السيارة');
    const realCarId = car.id;

    const body = await request.json();
    const {
      bookingId, rating, comment,
      carConditionRating, descriptionAccuracy, valueForMoney, dealerExperience,
    } = body as {
      bookingId?: string;
      rating?: number;
      comment?: string;
      carConditionRating?: number;
      descriptionAccuracy?: number;
      valueForMoney?: number;
      dealerExperience?: number;
    };

    // Validate the basics
    if (!bookingId) return errorResponse('معرّف الحجز مطلوب');
    if (!rating || rating < 1 || rating > 5) return errorResponse('التقييم العام يجب أن يكون بين 1 و 5');

    // Verify the booking
    const booking = await prisma.carBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, carId: true, buyerId: true, dealerId: true, status: true },
    });
    if (!booking) return notFoundResponse('الحجز');
    if (booking.carId !== realCarId) return errorResponse('الحجز لا يخص هذه السيارة');
    if (booking.buyerId !== user.id) {
      return errorResponse('لا يمكن تقييم سيارة لم تحجزها بنفسك', 403);
    }
    if (booking.status !== 'COMPLETED') {
      return errorResponse('لا يمكن التقييم قبل إكمال الصفقة', 409);
    }
    const targetUserId = booking.dealerId;

    // Subrating caps
    const cap = (v: number | null | undefined) =>
      (typeof v === 'number' && v >= 1 && v <= 5) ? v : null;

    let createdId: string;
    try {
      const result = await prisma.$transaction(async (tx) => {
        const review = await tx.carReview.create({
          data: {
            carId: realCarId,
            userId: user.id,
            targetUserId,
            bookingId: booking.id,
            rating: Math.round(rating),
            comment: typeof comment === 'string' && comment.trim() ? comment.trim().slice(0, 1000) : null,
            isVerified: true, // purchased through a completed booking
            carConditionRating: cap(carConditionRating),
            descriptionAccuracy: cap(descriptionAccuracy),
            valueForMoney: cap(valueForMoney),
            dealerExperience: cap(dealerExperience),
          },
        });

        // Recompute aggregated Car.rating + Car.reviewCount
        const all = await tx.carReview.findMany({
          where: { carId: realCarId, isHidden: false },
          select: { rating: true },
        });
        const avg = all.length > 0
          ? all.reduce((sum, r) => sum + r.rating, 0) / all.length
          : 0;

        await tx.car.update({
          where: { id: realCarId },
          data: {
            rating: Math.round(avg * 10) / 10,
            reviewCount: all.length,
          },
        });
        return review;
      });
      createdId = result.id;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return errorResponse('لديك تقييم منشور على هذه السيارة بالفعل', 409);
      }
      throw err;
    }

    // Best-effort notification to the dealer
    await prisma.notification.create({
      data: {
        type: 'NEW_REVIEW',
        title: 'تقييم جديد',
        message: `حصلت على تقييم ${Math.round(rating)}/5 على سيارتك`,
        userId: targetUserId,
        link: `/cars/${realCarId}`,
      },
    }).catch(() => { /* best-effort */ });

    return successResponse({ id: createdId }, 201);
  } catch (error) {
    console.error('car reviews POST error:', error);
    return errorResponse('فشل إنشاء التقييم', 500);
  }
}
