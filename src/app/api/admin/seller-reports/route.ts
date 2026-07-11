import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const search = request.nextUrl.searchParams.get('search') || '';

    const where: Record<string, unknown> = {
      role: 'DEALER',
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { dealerName: { contains: search } },
          { email: { contains: search } },
        ],
      } : {}),
    };

    const dealers = await prisma.user.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dealerName: true,
        dealerLogo: true,
        rating: true,
        ratingCount: true,
        createdAt: true,
        image: true,
        _count: {
          select: {
            cars: true,
            messagesSent: true,
            messagesRecv: true,
            receivedRatings: true,
          },
        },
      },
    });

    const reports = await Promise.all(
      dealers.map(async (dealer) => {
        const soldCars = await prisma.car.count({
          where: { userId: dealer.id, status: 'SOLD' },
        });

        const activeCars = await prisma.car.count({
          where: { userId: dealer.id, status: 'APPROVED' },
        });

        const totalConversations = await prisma.conversation.count({
          where: { sellerId: dealer.id },
        });

        const convWithMessages = await prisma.conversation.findMany({
          where: { sellerId: dealer.id },
          select: {
            id: true,
            createdAt: true,
            messages: {
              take: 2,
              orderBy: { createdAt: 'asc' },
              select: { createdAt: true },
            },
          },
        });

        let avgResponseTime = null;
        const responseTimes: number[] = [];
        for (const conv of convWithMessages) {
          if (conv.messages.length >= 2) {
            const buyMsg = conv.messages[0].createdAt;
            const sellerMsg = conv.messages[1].createdAt;
            const diff = (sellerMsg.getTime() - buyMsg.getTime()) / (1000 * 60);
            if (diff > 0 && diff < 10080) responseTimes.push(diff);
          }
        }
        if (responseTimes.length > 0) {
          avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
        }

        const totalViewsResult = await prisma.car.aggregate({
          where: { userId: dealer.id },
          _sum: { views: true },
        });

        return {
          id: dealer.id,
          name: dealer.name,
          email: dealer.email,
          phone: dealer.phone,
          dealerName: dealer.dealerName,
          dealerLogo: dealer.dealerLogo,
          image: dealer.image,
          rating: dealer.rating,
          ratingCount: dealer.ratingCount,
          joinedAt: dealer.createdAt,
          totalCars: dealer._count.cars,
          soldCars,
          activeCars,
          totalViews: totalViewsResult._sum.views || 0,
          totalConversations,
          avgResponseTime,
          ratingDistribution: await getRatingDistribution(dealer.id),
        };
      })
    );

    reports.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return successResponse(reports);
  } catch (error) {
    console.error('Seller reports error:', error);
    return errorResponse('فشل تحميل التقارير', 500);
  }
}

async function getRatingDistribution(userId: string) {
  const ratings = await prisma.userRating.findMany({
    where: { targetUserId: userId },
    select: { score: true },
  });

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    dist[r.score] = (dist[r.score] || 0) + 1;
  }

  return Object.entries(dist).map(([score, count]) => ({ score: parseInt(score), count }));
}
