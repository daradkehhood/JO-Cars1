import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET() {
  try {
    const dealers = await prisma.user.findMany({
      where: { role: 'DEALER', isActive: true },
      select: {
        id: true, name: true, phone: true, image: true,
        dealerName: true, dealerLogo: true, dealerDescription: true,
        dealerAddress: true, rating: true, ratingCount: true,
        badges: true,
        _count: { select: { cars: { where: { status: 'APPROVED' } } } },
      },
      orderBy: { rating: 'desc' },
    });
    return successResponse(dealers);
  } catch (error) {
    console.error('Dealers fetch error:', error);
    return errorResponse('فشل تحميل الوكلاء', 500);
  }
}
