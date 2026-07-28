import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

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

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const allowedFields = ['nameAr', 'nameEn', 'slug', 'brandId', 'isActive'];
    const safeData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) safeData[key] = body[key];
    }
    if (!safeData.nameAr || !safeData.slug || !safeData.brandId) {
      return errorResponse('الاسم والسلسلة والماركة مطلوبة', 400);
    }
    const model = await prisma.carModel.create({ data: safeData as any });
    return successResponse(model, 201);
  } catch (error) {
    console.error('Model create error:', error);
    return errorResponse('فشل إضافة الموديل', 500);
  }
}
