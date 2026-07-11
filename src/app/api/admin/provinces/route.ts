import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');

  try {
    const where: any = {};
    if (active !== null) where.isActive = active === 'true';

    const provinces = await prisma.province.findMany({
      where,
      orderBy: { nameAr: 'asc' },
    });
    return successResponse(provinces);
  } catch {
    return errorResponse('فشل تحميل المحافظات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const body = await request.json();
  if (!body.nameAr) return errorResponse('الاسم بالعربية مطلوب', 400);

  try {
    const slug = body.slug || body.nameAr.toLowerCase().replace(/\s+/g, '-');
    const province = await prisma.province.upsert({
      where: { slug },
      update: { nameAr: body.nameAr, nameEn: body.nameEn || body.nameAr, isActive: true },
      create: { nameAr: body.nameAr, nameEn: body.nameEn || body.nameAr, slug },
    });
    return successResponse(province, 201);
  } catch {
    return errorResponse('فشل إنشاء المحافظة', 500);
  }
}


