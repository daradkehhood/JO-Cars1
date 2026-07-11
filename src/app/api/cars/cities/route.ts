import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { nameAr: 'asc' },
      include: { _count: { select: { cars: true } } },
    });
    return successResponse(cities);
  } catch (error) {
    console.error('Cities fetch error:', error);
    return errorResponse('فشل تحميل المحافظات', 500);
  }
}
