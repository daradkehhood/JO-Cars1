import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const brandId = request.nextUrl.searchParams.get('brandId');
    const where: Record<string, unknown> = { isActive: true };
    if (brandId) where.brandId = brandId;

    const models = await prisma.carModel.findMany({
      where: where as any,
      orderBy: { nameAr: 'asc' },
      include: { _count: { select: { cars: true } } },
    });
    return successResponse(models);
  } catch (error) {
    console.error('Models fetch error:', error);
    return errorResponse('فشل تحميل الموديلات', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const model = await prisma.carModel.create({ data: body });
    return successResponse(model, 201);
  } catch (error) {
    console.error('Model create error:', error);
    return errorResponse('فشل إضافة الموديل', 500);
  }
}
