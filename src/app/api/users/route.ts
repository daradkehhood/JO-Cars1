import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  if (!userId) return errorResponse('Missing user ID', 400);

  try {
    const viewer = await authenticateRequest(request);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, image: true, bio: true,
        dealerName: true, dealerLogo: true, dealerDescription: true, dealerAddress: true,
        dealerLat: true, dealerLng: true,
        // Phase C trader marketplace fields
        dealerVerified: true, dealerViewCount: true, dealerBannerImage: true,
        dealerCommercialReg: true,
        rating: true, ratingCount: true, createdAt: true, role: true,
        _count: {
          select: {
            cars: { where: { status: 'ACTIVE' } },
            favorites: true,
            forumTopics: true,
            forumPosts: true,
          },
        },
      },
    });

    if (!user) return errorResponse('User not found', 404);

    const cars = await prisma.car.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        brand: true, model: true, city: true,
        images: { take: 1, orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    const recentRatings = await prisma.userRating.findMany({
      where: { targetUserId: userId },
      include: { rater: { select: { id: true, name: true, image: true, dealerName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Anonymous view-count increment — only count views for verified traders
    // who have a public profile, and don't count the user viewing their own
    // profile. Fire-and-forget so the response isn't blocked by the write.
    if (user.dealerVerified && (!viewer || viewer.id !== userId)) {
      prisma.user.update({
        where: { id: userId },
        data: { dealerViewCount: { increment: 1 } },
      }).catch(() => { /* view-count is best-effort */ });
    }

    return successResponse({ user, cars, recentRatings });
  } catch (error) {
    console.error('users GET error:', error);
    return errorResponse('Failed to load profile', 500);
  }
}

