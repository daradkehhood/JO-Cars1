import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse, errorResponse, unauthorizedResponse, notFoundResponse,
} from '@/lib/api';

/**
 * Create a car-purchase booking (حجز شراء سيارة). The caller is the buyer.
 *
 * POST /api/cars/bookings
 * body: {
 *   carId, wantsPurchase, wantsInspection, wantsTestDrive,
 *   visitDate?, visitTime?, headcount?, proposedPrice?, notes?,
 *   buyerName, buyerPhone, buyerEmail?, buyerCity?, buyerContactPref?
 * }
 *
 * Guards:
 *  - Required: authenticated user, the car must exist and mustn't be owned
 *    by the buyer, and one of the wants* flags must be true.
 *  - Race-safe against `@@unique([carId, buyerId])` via a Prisma P2002
 *    catch → returns "لديك حجز قائم مسبقًا على هذه السيارة" instead of 500.
 */
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const {
      carId, wantsPurchase, wantsInspection, wantsTestDrive,
      visitDate, visitTime, headcount, proposedPrice, notes,
      buyerName, buyerPhone, buyerEmail, buyerCity, buyerContactPref,
    } = body as {
      carId?: string;
      wantsPurchase?: boolean;
      wantsInspection?: boolean;
      wantsTestDrive?: boolean;
      visitDate?: string;
      visitTime?: string;
      headcount?: number;
      proposedPrice?: number;
      notes?: string;
      buyerName?: string;
      buyerPhone?: string;
      buyerEmail?: string;
      buyerCity?: string;
      buyerContactPref?: string;
    };

    if (!carId) return errorResponse('معرّف السيارة مطلوب');
    if (!buyerName || !buyerPhone) return errorResponse('الاسم ورقم الهاتف مطلوبان');
    if (!wantsPurchase && !wantsInspection && !wantsTestDrive) {
      return errorResponse('اختر نوع الطلب (شراء / معاينة / قيادة تجريبية)');
    }

    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, slug: true, userId: true, status: true, price: true },
    });
    if (!car) return notFoundResponse('السيارة');
    if (car.userId === user.id) return errorResponse('لا يمكنك حجز سيارتك');
    if (car.status !== 'ACTIVE') return errorResponse('السيارة غير متاحة للحجز');

    // Visit date should be in the future if provided
    let visitDateISO: Date | null = null;
    if (visitDate) {
      const d = new Date(visitDate);
      if (isNaN(d.getTime())) return errorResponse('تاريخ الزيارة غير صحيح');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) return errorResponse('تاريخ الزيارة يجب أن يكون مستقبليًا');
      visitDateISO = d;
    }

    const dealerId = car.userId;

    try {
      const booking = await prisma.carBooking.create({
        data: {
          carId,
          dealerId,
          buyerId: user.id,
          wantsPurchase: !!wantsPurchase,
          wantsInspection: !!wantsInspection,
          wantsTestDrive: !!wantsTestDrive,
          visitDate: visitDateISO,
          visitTime: visitTime || null,
          headcount: Math.max(1, Math.min(20, Number(headcount) || 1)),
          proposedPrice: proposedPrice != null ? Number(proposedPrice) : null,
          notes: notes || null,
          status: 'PENDING',
          buyerName,
          buyerPhone,
          buyerEmail: buyerEmail || null,
          buyerCity: buyerCity || null,
          buyerContactPref: buyerContactPref || null,
        },
        include: {
          car: { select: { id: true, slug: true, price: true } },
          buyer: { select: { id: true, name: true, image: true } },
          dealer: { select: { id: true, name: true, phone: true, whatsapp: true } },
        },
      });

      // Drop a Notification on the dealer's dashboard so it shows up in their
      // bell immediately (no socket push needed — list refetch pulls it).
      await prisma.notification.create({
        data: {
          type: 'NEW_BOOKING',
          title: 'طلب حجز جديد',
          message: `طلب حجز جديد على ${car.slug || 'سيارة'} من ${buyerName}`,
          userId: dealerId,
          link: '/dashboard/bookings',
        },
      }).catch(() => { /* notification is best-effort */ });

      return successResponse(booking, 201);
    } catch (err: any) {
      // Prisma P2002 = unique constraint violation → existing booking
      if (err?.code === 'P2002') {
        return errorResponse('لديك حجز قائم مسبقًا على هذه السيارة. انتظر قرار التاجر أو ألغِ الحجز الحالي.', 409);
      }
      throw err;
    }
  } catch (error) {
    console.error('Create booking error:', error);
    return errorResponse('فشل إنشاء الحجز', 500);
  }
}
