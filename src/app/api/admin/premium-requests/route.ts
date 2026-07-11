import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const status = request.nextUrl.searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const requests = await prisma.premiumRequest.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: {
        car: {
          select: {
            id: true, slug: true, price: true, year: true,
            brand: { select: { nameAr: true } },
            model: { select: { nameAr: true } },
            images: { take: 1, select: { url: true } },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return successResponse(requests);
  } catch (error) {
    return errorResponse('فشل تحميل الطلبات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return errorResponse('بيانات غير صالحة');
    }

    const req = await prisma.premiumRequest.findUnique({
      where: { id: requestId },
      include: { car: true },
    });

    if (!req) return errorResponse('الطلب غير موجود', 404);
    if (req.status !== 'PENDING') return errorResponse('تم معالجة الطلب مسبقاً');

    const now = new Date();

    if (action === 'APPROVE') {
      if (req.type === 'FEATURE') {
        const featuredUntil = new Date(Date.now() + 30 * 86400000);
        await prisma.car.update({
          where: { id: req.carId },
          data: { featured: true, featuredUntil },
        });
      }

      await prisma.premiumRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', reviewedBy: user.id, reviewedAt: now },
      });
    } else {
      await prisma.premiumRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', reviewedBy: user.id, reviewedAt: now },
      });
    }

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('فشل معالجة الطلب', 500);
  }
}
