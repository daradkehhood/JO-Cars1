import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    const [ads, total] = await Promise.all([
      prisma.workshopAd.findMany({
        where,
        include: {
          workshop: {
            select: { id: true, name: true },
          },
          owner: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workshopAd.count({ where }),
    ]);

    return successResponse({
      ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin ads fetch error:', error);
    return errorResponse('فشل تحميل الإعلانات', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');

    if (!adId) return errorResponse('معرف الإعلان مطلوب');

    const ad = await prisma.workshopAd.findUnique({ where: { id: adId } });
    if (!ad) return errorResponse('الإعلان غير موجود', 404);

    await prisma.workshopAd.delete({ where: { id: adId } });

    return successResponse({ message: 'تم حذف الإعلان بنجاح' });
  } catch (error) {
    console.error('Admin ad delete error:', error);
    return errorResponse('فشل حذف الإعلان', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { adId, status, rejectReason } = body;

    if (!adId) return errorResponse('معرف الإعلان مطلوب');
    if (!status) return errorResponse('الحالة مطلوبة');

    if (!['published', 'rejected'].includes(status)) {
      return errorResponse('الحالة غير صحيحة');
    }

    if (status === 'rejected' && !rejectReason) {
      return errorResponse('سبب الرفض مطلوب');
    }

    const ad = await prisma.workshopAd.findUnique({ where: { id: adId } });
    if (!ad) return errorResponse('الإعلان غير موجود', 404);

    const updated = await prisma.workshopAd.update({
      where: { id: adId },
      data: {
        status,
        rejectReason: status === 'rejected' ? rejectReason : null,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
      include: {
        workshop: {
          select: { id: true, name: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Admin ad update error:', error);
    return errorResponse('فشل تحديث الإعلان', 500);
  }
}
