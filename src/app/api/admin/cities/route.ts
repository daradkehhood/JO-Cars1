import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');
  const provinceId = searchParams.get('provinceId');
  const search = searchParams.get('search');

  try {
    const where: any = {};
    if (active !== null) where.isActive = active === 'true';
    if (provinceId) where.provinceId = provinceId;
    if (search) where.nameAr = { contains: search };

    const cities = await prisma.city.findMany({
      where,
      orderBy: { nameAr: 'asc' },
      include: { province: { select: { id: true, nameAr: true } } },
    });
    return successResponse(cities);
  } catch {
    return errorResponse('فشل تحميل المدن', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const body = await request.json();

  try {
    let provinceId = body.provinceId;

    if (!provinceId && body.autoCreate && body.provinceName) {
      const province = await prisma.province.upsert({
        where: { slug: body.provinceName.toLowerCase().replace(/\s+/g, '-') },
        update: { nameAr: body.provinceName, nameEn: body.provinceName, isActive: true },
        create: { nameAr: body.provinceName, nameEn: body.provinceName, slug: body.provinceName.toLowerCase().replace(/\s+/g, '-') },
      });
      provinceId = province.id;
    }

    const slug = body.slug || body.nameAr.toLowerCase().replace(/\s+/g, '-');
    const city = await prisma.city.upsert({
      where: { slug },
      update: { nameAr: body.nameAr, nameEn: body.nameEn || body.nameAr, provinceId: provinceId || null, isActive: true },
      create: { nameAr: body.nameAr, nameEn: body.nameEn || body.nameAr, provinceId: provinceId || null, slug },
    });
    return successResponse(city, 201);
  } catch {
    return errorResponse('فشل إنشاء المدينة', 500);
  }
}


