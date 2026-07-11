import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetUserId, carId, score, comment } = await request.json();

  if (!targetUserId || !carId || !score) {
    return NextResponse.json({ error: 'المستخدم، السيارة، والتقييم مطلوب' }, { status: 400 });
  }
  if (score < 1 || score > 5) {
    return NextResponse.json({ error: 'التقييم من 1 إلى 5' }, { status: 400 });
  }
  if (user.id === targetUserId) {
    return NextResponse.json({ error: 'لا يمكن تقييم نفسك' }, { status: 400 });
  }

  const car = await prisma.car.findUnique({
    where: { id: carId },
    include: { brand: true, model: true },
  });
  if (!car) return NextResponse.json({ error: 'السيارة غير موجودة' }, { status: 404 });

  if (car.userId !== targetUserId) {
    return NextResponse.json({ error: 'يمكن تقييم البائع فقط' }, { status: 400 });
  }

  if (car.userId === user.id) {
    return NextResponse.json({ error: 'لا يمكن تقييم نفسك' }, { status: 400 });
  }

  const existing = await prisma.userRating.findUnique({
    where: { raterId_targetUserId_carId: { raterId: user.id, targetUserId, carId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'قيمت هذا البائع مسبقاً لهذه السيارة' }, { status: 409 });
  }

  const rating = await prisma.userRating.create({
    data: { score, comment, raterId: user.id, targetUserId, carId },
  });

  const agg = await prisma.userRating.aggregate({
    where: { targetUserId },
    _avg: { score: true },
    _count: { score: true },
  });

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      rating: agg._avg.score ?? 0,
      ratingCount: agg._count.score,
    },
  });

  await prisma.notification.create({
    data: {
      type: 'NEW_RATING',
      title: 'تقييم جديد',
      message: `حصلت على تقييم ${score}/5 من ${user.name} على السيارة ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`,
      userId: targetUserId,
      link: `/cars/${car.slug || car.id}`,
    },
  }).catch(() => {});

  return NextResponse.json(rating, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const carId = searchParams.get('carId');

  if (!userId && !carId) {
    return NextResponse.json({ error: 'userId or carId required' }, { status: 400 });
  }

  const where: Record<string, unknown> = {};
  if (userId) where.targetUserId = userId;
  if (carId) where.carId = carId;

  const ratings = await prisma.userRating.findMany({
    where: where as any,
    include: {
      rater: { select: { id: true, name: true, image: true, dealerName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(ratings);
}
