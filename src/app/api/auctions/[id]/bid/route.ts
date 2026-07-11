import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const auction = await prisma.auction.findUnique({ where: { id }, include: { car: { select: { userId: true } }, bids: { orderBy: { amount: 'desc' }, take: 1 } } });
  if (!auction) return Response.json({ error: 'المزاد غير موجود' }, { status: 404 });
  if (auction.status !== 'ACTIVE') return Response.json({ error: 'المزاد منتهي' }, { status: 400 });
  if (auction.sellerId === user.id) return Response.json({ error: 'لا يمكنك المزايدة على سيارتك' }, { status: 400 });
  if (new Date(auction.endDate) < new Date()) return Response.json({ error: 'انتهى وقت المزاد' }, { status: 400 });

  const { amount } = await request.json();
  if (!amount || amount < auction.currentPrice + auction.minBidIncrement) {
    return Response.json({ error: `المبلغ يجب أن يكون على الأقل ${auction.currentPrice + auction.minBidIncrement} د.أ` }, { status: 400 });
  }

  const [bid] = await prisma.$transaction([
    prisma.bid.create({
      data: { amount, auctionId: id, userId: user.id },
    }),
    prisma.auction.update({ where: { id }, data: { currentPrice: amount } }),
  ]);

  const prevTopBidder = auction.bids[0] || null;

  if (prevTopBidder && prevTopBidder.userId !== user.id) {
    await prisma.notification.create({
      data: {
        type: 'BID_OUTBID',
        title: 'تم تجاوز مزايدتك',
        message: `تم تجاوز مزايدتك في مزاد ${auction.carId?.slice(0, 8)} بمبلغ ${amount} د.أ`,
        userId: prevTopBidder.userId,
        link: `/cars/${id}`,
      },
    }).catch(() => {});
  }

  return Response.json({ success: true, data: bid }, { status: 201 });
}
