import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

/**
 * List car-purchase bookings for the authenticated user, from either side:
 *  - GET /api/bookings                    → buyer's bookings (default)
 *  - GET /api/bookings?role=dealer       → dealer's bookings (cars they own)
 *  - GET /api/bookings?status=PENDING    → filter by status
 *  - GET /api/bookings?carId=abc          → restrict to a specific car
 *  - GET /api/bookings?page=1&limit=20    → pagination
 *
 * Response: {
 *   data: { bookings: [...], pagination: { page, limit, total, totalPages } }
 * }
 */
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const asDealer = searchParams.get('role') === 'dealer';
    const status = searchParams.get('status');
    const carId = searchParams.get('carId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = asDealer
      ? { dealerId: user.id }
      : { buyerId: user.id };
    if (status) where.status = status;
    if (carId) where.carId = carId;

    const [bookings, total] = await Promise.all([
      prisma.carBooking.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          car: {
            select: {
              id: true, slug: true, price: true, year: true,
              brand: { select: { nameAr: true } },
              model: { select: { nameAr: true } },
              images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
            },
          },
          buyer: asDealer
            ? { select: { id: true, name: true, image: true, phone: true } }
            : { select: { id: true, name: true, image: true } },
          dealer: !asDealer
            ? { select: { id: true, name: true, image: true, dealerName: true, phone: true, whatsapp: true } }
            : { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.carBooking.count({ where: where as any }),
    ]);

    return successResponse({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('bookings GET error:', error);
    return errorResponse('فشل تحميل الحجوزات', 500);
  }
}
