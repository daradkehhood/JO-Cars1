import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'ACTIVE';
  const userId = searchParams.get('userId');
  const brandId = searchParams.get('brandId');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (status !== 'ALL') where.status = status;
    if (brandId) where.brandId = brandId;
    if (search) where.title = { contains: search };
    if (userId) where.userId = userId;

    const [ads, total] = await Promise.all([
      prisma.wantedAd.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          brand: { select: { id: true, nameAr: true, nameEn: true } },
          model: { select: { id: true, nameAr: true, nameEn: true } },
          city: { select: { id: true, nameAr: true, nameEn: true } },
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { offers: true } },
        },
      }),
      prisma.wantedAd.count({ where }),
    ]);

    return successResponse({
      ads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: skip + ads.length < total },
    });
  } catch {
    return errorResponse('فشل تحميل الإعلانات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const ad = await prisma.wantedAd.create({
      data: {
        title: body.title,
        description: body.description || null,
        yearFrom: body.yearFrom ? parseInt(body.yearFrom) : null,
        yearTo: body.yearTo ? parseInt(body.yearTo) : null,
        maxPrice: body.maxPrice ? parseFloat(body.maxPrice) : null,
        phone: body.phone || user.phone || '',
        whatsapp: body.whatsapp || null,
        brandId: body.brandId || null,
        modelId: body.modelId || null,
        cityId: body.cityId || null,
        userId: user.id,
      },
    });
    return successResponse(ad, 201);
  } catch (error) {
    console.error(error);
    return errorResponse('فشل إنشاء الإعلان', 500);
  }
}
