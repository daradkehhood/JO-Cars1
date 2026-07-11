import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const models = await prisma.carModel.findMany({
      include: { brand: { select: { id: true, nameAr: true, nameEn: true } }, _count: { select: { cars: true } } },
      orderBy: [{ brand: { nameAr: 'asc' } }, { nameAr: 'asc' }],
    });
    return successResponse(models);
  } catch { return errorResponse('فشل تحميل الموديلات', 500); }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  try {
    const { nameAr, nameEn, brandId, isActive } = await request.json();
    if (!nameAr || !nameEn || !brandId) return errorResponse('الاسم والشركة مطلوبان');
    const slug = slugify(nameEn + brandId);
    const model = await prisma.carModel.create({ data: { nameAr, nameEn, slug, brandId, isActive: isActive !== false } });
    return successResponse(model, 201);
  } catch { return errorResponse('فشل إضافة الموديل', 500); }
}

export async function PATCH(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  try {
    const { id, nameAr, nameEn, brandId, isActive } = await request.json();
    const existing = await prisma.carModel.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('الموديل');
    const data: Record<string, unknown> = {};
    if (nameAr !== undefined) data.nameAr = nameAr;
    if (nameEn !== undefined) data.nameEn = nameEn;
    if (brandId !== undefined) data.brandId = brandId;
    if (nameEn !== undefined) data.slug = slugify(nameEn + (brandId || existing.brandId));
    if (isActive !== undefined) data.isActive = isActive;
    const model = await prisma.carModel.update({ where: { id }, data });
    return successResponse(model);
  } catch { return errorResponse('فشل تحديث الموديل', 500); }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  try {
    const { id } = await request.json();
    const carCount = await prisma.car.count({ where: { modelId: id } });
    if (carCount > 0) return errorResponse('لا يمكن حذف موديل مرتبط بسيارات', 400);
    await prisma.carModel.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch { return errorResponse('فشل حذف الموديل', 500); }
}
