import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');
    const status = request.nextUrl.searchParams.get('status');
    const search = request.nextUrl.searchParams.get('search');
    const sort = request.nextUrl.searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    else where.status = 'AVAILABLE';
    if (search) where.plateNumber = { contains: search };

    const orderBy: Record<string, string> =
      sort === 'price_asc' ? { price: 'asc' } :
      sort === 'price_desc' ? { price: 'desc' } :
      { createdAt: 'desc' };

    const plates = await prisma.plate.findMany({
      where: where as any,
      orderBy: orderBy as any,
      include: {
        seller: { select: { id: true, name: true, image: true, dealerName: true } },
      },
    });

    return successResponse(plates);
  } catch (error) {
    return errorResponse('فشل تحميل اللوحات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();
  if (user.canPost === false) return errorResponse('تم إيقاف النشر لحسابك', 403);

  try {
    const body = await request.json();
    const { plateNumber, type, price, description, phone, whatsapp, isNegotiable } = body;

    if (!plateNumber || !price || !phone) {
      return errorResponse('رقم اللوحة والسعر والهاتف مطلوبون');
    }

    const plate = await prisma.plate.create({
      data: {
        plateNumber,
        type: type || 'STANDARD',
        price: parseFloat(price),
        description: description || null,
        phone,
        whatsapp: whatsapp || null,
        isNegotiable: isNegotiable === true,
        sellerId: user.id,
      },
    });

    return successResponse(plate, 201);
  } catch (error) {
    return errorResponse('فشل إضافة اللوحة', 500);
  }
}
