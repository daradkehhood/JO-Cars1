import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const ad = await prisma.wantedAd.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, nameAr: true, nameEn: true } },
        model: { select: { id: true, nameAr: true, nameEn: true } },
        city: { select: { id: true, nameAr: true, nameEn: true } },
        user: { select: { id: true, name: true, image: true, phone: true } },
        _count: { select: { offers: true } },
      },
    });
    if (!ad) return errorResponse('غير موجود', 404);
    await prisma.wantedAd.update({ where: { id }, data: { views: { increment: 1 } } });
    return successResponse(ad);
  } catch {
    return errorResponse('فشل تحميل الإعلان', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const ad = await prisma.wantedAd.findUnique({ where: { id } });
  if (!ad || ad.userId !== user.id) return errorResponse('غير مصرح', 403);

  try {
    const body = await request.json();
    const updated = await prisma.wantedAd.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        yearFrom: body.yearFrom ? parseInt(body.yearFrom) : null,
        yearTo: body.yearTo ? parseInt(body.yearTo) : null,
        maxPrice: body.maxPrice ? parseFloat(body.maxPrice) : null,
        phone: body.phone,
        whatsapp: body.whatsapp,
        brandId: body.brandId || null,
        modelId: body.modelId || null,
        cityId: body.cityId || null,
        status: body.status || 'ACTIVE',
      },
    });
    return successResponse(updated);
  } catch {
    return errorResponse('فشل التحديث', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const ad = await prisma.wantedAd.findUnique({ where: { id } });
  if (!ad || (ad.userId !== user.id && user.role !== 'ADMIN')) return errorResponse('غير مصرح', 403);

  await prisma.wantedAd.delete({ where: { id } });
  return successResponse({ deleted: true });
}
