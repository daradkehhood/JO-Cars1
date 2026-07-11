import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);

  const ad = await prisma.wantedAd.findUnique({ where: { id } });
  if (!ad) return errorResponse('غير موجود', 404);

  try {
    const body = await request.json();
    const offer = await prisma.wantedOffer.create({
      data: {
        name: body.name,
        phone: body.phone,
        carDetails: body.carDetails,
        price: body.price ? parseFloat(body.price) : null,
        description: body.description || null,
        wantedAdId: id,
        userId: user?.id || null,
      },
    });
    return successResponse(offer, 201);
  } catch {
    return errorResponse('فشل إرسال العرض', 500);
  }
}
