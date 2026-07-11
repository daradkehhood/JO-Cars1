import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
      include: { _count: { select: { cars: true } } },
    });
    return successResponse(brands);
  } catch (error) {
    console.error('Brands fetch error:', error);
    return errorResponse('فشل تحميل الشركات', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brand = await prisma.brand.create({ data: body });
    return successResponse(brand, 201);
  } catch (error) {
    console.error('Brand create error:', error);
    return errorResponse('فشل إضافة الشركة', 500);
  }
}
