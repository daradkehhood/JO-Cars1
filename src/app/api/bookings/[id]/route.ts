import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse, errorResponse, unauthorizedResponse, notFoundResponse,
} from '@/lib/api';

/**
 * Per-booking actions for both buyer and dealer.
 *
 *   GET    /api/bookings/[id]                 → fetch single booking (caller must be a party)
 *   PATCH  /api/bookings/[id] { status, rejectReason?, finalPrice? }
 *     Dealer-only PATCH transitions:
 *       PENDING → ACCEPTED  : atomically creates a Conversation (+drawer links),
 *                              drops an opening system Message, posts a buyer
 *                              notification.
 *       PENDING → REJECTED  : stores rejectReason.
 *       *      → COMPLETED  : stores finalPrice (if provided), lets buyer submit
 *                              a CarReview (handled by the reviews API).
 *     Buyer-only PATCH transitions:
 *       (PENDING|ACCEPTED) → CANCELLED — the buyer can pull out before the deal is
 *                              completed. dealerId-side is the only one allowed to
 *                              ACCEPT/REJECT/COMPLETE.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const booking = await prisma.carBooking.findUnique({
      where: { id: params.id },
      include: {
        car: {
          select: {
            id: true, slug: true, price: true, year: true,
            brand: { select: { nameAr: true } },
            model: { select: { nameAr: true } },
            images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
          },
        },
        buyer: { select: { id: true, name: true, image: true, phone: true } },
        dealer: { select: { id: true, name: true, image: true, dealerName: true, phone: true, whatsapp: true } },
        conversation: { select: { id: true } },
      },
    });
    if (!booking) return notFoundResponse('الحجز');
    if (booking.buyerId !== user.id && booking.dealerId !== user.id) {
      return errorResponse('غير مصرح لك بعرض هذا الحجز', 403);
    }
    return successResponse(booking);
  } catch (error) {
    console.error('booking GET error:', error);
    return errorResponse('فشل تحميل الحجز', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { status, rejectReason, finalPrice } = body as {
      status?: string;
      rejectReason?: string;
      finalPrice?: number;
    };
    if (!status || !['ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return errorResponse('حالة غير صالحة');
    }

    const booking = await prisma.carBooking.findUnique({
      where: { id: params.id },
      include: { car: { select: { id: true, slug: true, price: true } } },
    });
    if (!booking) return notFoundResponse('الحجز');
    if (booking.buyerId !== user.id && booking.dealerId !== user.id) {
      return errorResponse('غير مصرح لك بتعديل هذا الحجز', 403);
    }

    // Authorization matrix
    const isDealer = booking.dealerId === user.id;
    const isBuyer = booking.buyerId === user.id;
    if (status === 'CANCELLED' && !isBuyer) {
      return errorResponse('لا يمكن إلغاء الحجز إلا من قبل المشتري', 403);
    }
    if (['ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status) && !isDealer) {
      return errorResponse('لا يمكن قبول/رفض/إكمال الحجز إلا من قبل التاجر', 403);
    }
    // State-guard: enforce a sane transition
    if (booking.status === 'COMPLETED') {
      return errorResponse('الحجز مكتمل بالفعل ولا يمكن تعديله', 409);
    }
    if (booking.status === 'CANCELLED') {
      return errorResponse('الحجز ملغى ولا يمكن تعديله', 409);
    }
    if (booking.status === 'REJECTED' && status !== 'REJECTED') {
      return errorResponse('الحجز مرفوض ولا يمكن تغيير حالته', 409);
    }
    if (booking.status === 'ACCEPTED' && status === 'ACCEPTED') {
      return errorResponse('الحجز مقبول بالفعل', 409);
    }
    // REJECTED is only valid from PENDING
    if (status === 'REJECTED' && booking.status !== 'PENDING') {
      return errorResponse('لا يمكن رفض حجز ليس قيد الانتظار', 409);
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'REJECTED') {
      updateData.rejectReason = rejectReason || 'لم يحدد سبب';
    }
    if (status === 'COMPLETED' && finalPrice != null) {
      updateData.finalPrice = Number(finalPrice);
    }

    // ACCEPTED — create a conversation (upsert on the unique triple as a
    // race-guard) and link this booking to it, inside a transaction so we
    // can never end up with an accepted booking but no conversation.
    if (status === 'ACCEPTED') {
      const carId = booking.carId;
      const buyerId = booking.buyerId;
      const sellerId = booking.dealerId;

      const updated = await prisma.$transaction(async (tx) => {
        // upsert against @@unique([carId, buyerId, sellerId])
        const conversation = await tx.conversation.upsert({
          where: { carId_buyerId_sellerId: { carId, buyerId, sellerId } },
          create: { carId, buyerId, sellerId },
          update: { updatedAt: new Date() },
        });

        // Opening system message from the dealer
        const openingText =
          `تم قبول حجزك للسيارة ${booking.car.slug || ''} من قبل التاجر. ` +
          `يمكنك الآن ترتيب موعد الزيارة أو مناقشة السعر.`;
        await tx.message.create({
          data: {
            content: openingText,
            senderId: sellerId,
            receiverId: buyerId,
            carId,
            conversationId: conversation.id,
          },
        });

        // Stamp the conversation with bookingId (one-to-one) if not set
        // AND link the booking back. Use updateMany on the conversation to
        // only set bookingId if it's currently null (idempotent re-accepts).
        if (!conversation.bookingId) {
          await tx.conversation.update({
            where: { id: conversation.id },
            data: { bookingId: booking.id },
          });
        }

        const updatedBooking = await tx.carBooking.update({
          where: { id: booking.id },
          data: {
            ...updateData,
            conversationId: conversation.id,
            viewedByDealer: true, // dealer just acted → no longer "unread"
          },
          include: {
            car: {
              select: {
                id: true, slug: true, price: true, year: true,
                brand: { select: { nameAr: true } },
                model: { select: { nameAr: true } },
                images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
              },
            },
            buyer: { select: { id: true, name: true, image: true, phone: true } },
            dealer: { select: { id: true, name: true, image: true, dealerName: true, phone: true, whatsapp: true } },
            conversation: { select: { id: true } },
          },
        });

        return updatedBooking;
      });

      // Outside the transaction — best-effort buyer notification
      await prisma.notification.create({
        data: {
          type: 'BOOKING_ACCEPTED',
          title: 'تم قبول حجزك',
          message: `قبل التاجر حجزك لسيارة ${booking.car.slug || ''}. يمكن للمحادثة أن تبدأ الآن.`,
          userId: booking.buyerId,
          link: '/messages',
        },
      }).catch(() => { /* best-effort */ });

      return successResponse(updated);
    }

    if (status === 'COMPLETED') {
      const updated = await prisma.carBooking.update({
        where: { id: booking.id },
        data: updateData,
        include: {
          car: {
            select: {
              id: true, slug: true, price: true, year: true,
              brand: { select: { nameAr: true } },
              model: { select: { nameAr: true } },
              images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
            },
          },
          buyer: { select: { id: true, name: true, image: true, phone: true } },
          dealer: { select: { id: true, name: true, image: true, dealerName: true, phone: true, whatsapp: true } },
          conversation: { select: { id: true } },
        },
      });

      // Notify the buyer that the deal completed → they can now rate
      await prisma.notification.create({
        data: {
          type: 'BOOKING_COMPLETED',
          title: 'تم إكمال الصفقة',
          message: 'يمكنك الآن تقييم السيارة والتاجر مبنية على تجربتك.',
          userId: booking.buyerId,
          link: `/cars/${booking.carId}`,
        },
      }).catch(() => { /* best-effort */ });

      return successResponse(updated);
    }

    // REJECTED or CANCELLED — straightforward update
    const updated = await prisma.carBooking.update({
      where: { id: booking.id },
      data: updateData,
      include: {
        car: {
          select: {
            id: true, slug: true, price: true, year: true,
            brand: { select: { nameAr: true } },
            model: { select: { nameAr: true } },
            images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
          },
        },
        buyer: { select: { id: true, name: true, image: true, phone: true } },
        dealer: { select: { id: true, name: true, image: true, dealerName: true, phone: true, whatsapp: true } },
        conversation: { select: { id: true } },
      },
    });

    // Notify the other side when the deal is closed by one party
    const notifyUserId = status === 'REJECTED' ? booking.buyerId : booking.dealerId;
    const notifyMsg =
      status === 'REJECTED'
        ? `تم رفض حجزك للسيارة ${booking.car.slug || ''} من قبل التاجر${rejectReason ? ` — السبب: ${rejectReason}` : ''}.`
        : `ألغى المشتري حجز السيارة ${booking.car.slug || ''}.`;
    await prisma.notification.create({
      data: {
        type: status === 'REJECTED' ? 'BOOKING_REJECTED' : 'BOOKING_CANCELLED',
        title: status === 'REJECTED' ? 'تم رفض حجزك' : 'تم إلغاء الحجز',
        message: notifyMsg,
        userId: notifyUserId,
        link: '/dashboard/bookings',
      },
    }).catch(() => { /* best-effort */ });

    return successResponse(updated);
  } catch (error) {
    console.error('booking PATCH error:', error);
    return errorResponse('فشل تحديث الحجز', 500);
  }
}
