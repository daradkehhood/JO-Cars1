import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'all') {
    const auctions = await prisma.auction.findMany({
      where: { status: 'ACTIVE', endDate: { gt: new Date() } },
      orderBy: { startDate: 'desc' },
      include: {
        car: { select: { id: true, slug: true, year: true, price: true, coverImage: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } } } },
        _count: { select: { bids: true } },
      },
    });
    return Response.json({ success: true, data: auctions });
  }

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (type === 'seller') {
    const auctions = await prisma.auction.findMany({
      where: { sellerId: user.id },
      orderBy: { startDate: 'desc' },
      include: {
        car: { select: { id: true, slug: true, year: true, price: true, coverImage: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } } } },
        _count: { select: { bids: true } },
      },
    });
    return Response.json({ success: true, data: auctions });
  }

  if (type === 'bidder') {
    const auctions = await prisma.auction.findMany({
      where: { bids: { some: { userId: user.id } } },
      orderBy: { startDate: 'desc' },
      include: {
        car: { select: { id: true, slug: true, year: true, price: true, coverImage: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } } } },
        bids: { where: { userId: user.id }, orderBy: { amount: 'desc' }, take: 1 },
        _count: { select: { bids: true } },
      },
    });
    return Response.json({ success: true, data: auctions });
  }

  return Response.json({ success: false, error: 'نوع غير صالح' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { carId, startingPrice, endDate, minBidIncrement } = await request.json();
  if (!carId || !startingPrice || !endDate) {
    return Response.json({ error: 'معرّف السيارة، السعر المبدئي، وتاريخ الانتهاء مطلوب' }, { status: 400 });
  }

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) return Response.json({ error: 'السيارة غير موجودة' }, { status: 404 });
  if (car.userId !== user.id) return Response.json({ error: 'لست مالك هذه السيارة' }, { status: 403 });

  const existing = await prisma.auction.findUnique({ where: { carId } });
  if (existing && existing.status === 'ACTIVE') return Response.json({ error: 'يوجد مزاد نشط لهذه السيارة' }, { status: 400 });

  const auction = await prisma.auction.create({
    data: {
      carId, sellerId: user.id,
      startingPrice, currentPrice: startingPrice,
      endDate: new Date(endDate),
      minBidIncrement: minBidIncrement || 10,
    },
  });

  return Response.json({ success: true, data: auction }, { status: 201 });
}
