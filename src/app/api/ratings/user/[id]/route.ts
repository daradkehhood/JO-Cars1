import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ratings = await prisma.userRating.findMany({
    where: { targetUserId: id },
    include: {
      rater: { select: { id: true, name: true, image: true, dealerName: true } },
      car: { select: { id: true, slug: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const agg = await prisma.userRating.aggregate({
    where: { targetUserId: id },
    _avg: { score: true },
    _count: { score: true },
  });

  return NextResponse.json({
    ratings,
    average: agg._avg.score ?? 0,
    total: agg._count.score,
  });
}
