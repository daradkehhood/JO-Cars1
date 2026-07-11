import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: { _count: { select: { cars: true, models: true } } },
      orderBy: { nameAr: 'asc' },
    });
    return successResponse(brands);
  } catch {
    return errorResponse('فشل تحميل الشركات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  try {
    const { nameAr, nameEn, country, isActive } = await request.json();
    if (!nameAr || !nameEn) return errorResponse('الاسم مطلوب');
    const slug = slugify(nameEn);
    const brand = await prisma.brand.create({ data: { nameAr, nameEn, slug, country, isActive: isActive !== false } });
    return successResponse(brand, 201);
  } catch {
    return errorResponse('فشل إضافة الشركة', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  try {
    const { id, nameAr, nameEn, country, isActive, logo } = await request.json();
    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('الشركة');
    const data: Record<string, unknown> = {};
    if (nameAr !== undefined) data.nameAr = nameAr;
    if (nameEn !== undefined) data.nameEn = nameEn;
    if (country !== undefined) data.country = country;
    if (logo !== undefined) data.logo = logo;
    if (nameEn !== undefined && nameEn !== existing.nameEn) data.slug = slugify(nameEn);
    if (isActive !== undefined) data.isActive = isActive;
    const brand = await prisma.brand.update({ where: { id }, data });
    return successResponse(brand);
  } catch {
    return errorResponse('فشل تحديث الشركة', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  try {
    const { id } = await request.json();
    const carCount = await prisma.car.count({ where: { brandId: id } });
    if (carCount > 0) return errorResponse('لا يمكن حذف شركة مرتبطة بسيارات', 400);
    await prisma.brand.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse('فشل حذف الشركة', 500);
  }
}
