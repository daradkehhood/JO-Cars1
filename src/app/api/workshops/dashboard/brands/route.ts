import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const brands = await prisma.workshopBrand.findMany({
      where: { workshopId: workshop.id },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = brands.map((b) => ({
      id: b.id,
      nameAr: b.brand,
      logo: null,
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('Brands list error:', error);
    return errorResponse('فشل تحميل الماركات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const body = await request.json();
    const { nameAr } = body;

    if (!nameAr || !nameAr.trim()) {
      return errorResponse('اسم الماركة مطلوب');
    }

    const brand = await prisma.workshopBrand.create({
      data: {
        workshopId: workshop.id,
        brand: nameAr,
      },
    });

    return successResponse({ id: brand.id, nameAr: brand.brand, logo: null }, 201);
  } catch (error) {
    console.error('Brand create error:', error);
    return errorResponse('فشل إضافة الماركة', 500);
  }
}
