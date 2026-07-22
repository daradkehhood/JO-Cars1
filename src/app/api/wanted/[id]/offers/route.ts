import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimit = checkRateLimit(`wanted-offer:${user.id}`, RATE_LIMITS.GENERAL);
  if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

  const ad = await prisma.wantedAd.findUnique({ where: { id } });
  if (!ad) return errorResponse('غير موجود', 404);

  try {
    const body = await request.json();
    const name = String(body.name || '').trim().slice(0, 100);
    const phone = String(body.phone || '').trim().slice(0, 20);
    const carDetails = String(body.carDetails || '').trim().slice(0, 500);
    const description = String(body.description || '').trim().slice(0, 1000);
    const price = body.price ? parseFloat(String(body.price)) : null;

    if (!name || !phone || !carDetails) {
      return errorResponse('الاسم والهاتف وتفاصيل السيارة مطلوبة');
    }

    const offer = await prisma.wantedOffer.create({
      data: {
        name, phone, carDetails,
        price: isNaN(price as number) ? null : price,
        description: description || null,
        wantedAdId: id,
        userId: user.id,
      },
    });
    return successResponse(offer, 201);
  } catch {
    return errorResponse('فشل إرسال العرض', 500);
  }
}
