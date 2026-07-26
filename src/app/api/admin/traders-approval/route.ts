import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

/**
 * Admin trader-approval queue. Mirrors the premium-requests route structure
 * but operates on the `TraderVerification` model (status PENDING|APPROVED|REJECTED).
 *
 * GET  /api/admin/traders-approval?status=PENDING  → list rows
 * POST /api/admin/traders-approval { requestId, action, rejectReason? }
 *      action: 'APPROVE' | 'REJECT'
 *      APPROVE → copies verification profile onto the User + sets
 *               `dealerVerified = true` (inside a transaction so a crash
 *               between the two writes leaves a consistent state).
 *      REJECT  → records `rejectReason` on the verification row.
 */
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const status = request.nextUrl.searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const requests = await prisma.traderVerification.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, phone: true, image: true,
            createdAt: true,
          },
        },
      },
    });

    return successResponse(requests);
  } catch (error) {
    console.error('traders-approval GET error:', error);
    return errorResponse('فشل تحميل طلبات الاعتماد', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { requestId, action, rejectReason } = body as {
      requestId?: string;
      action?: string;
      rejectReason?: string;
    };

    if (!requestId || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return errorResponse('بيانات غير صالحة');
    }

    const verification = await prisma.traderVerification.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!verification) return errorResponse('الطلب غير موجود', 404);
    if (verification.status !== 'PENDING') return errorResponse('تم معالجة الطلب مسبقاً');

    const now = new Date();

    if (action === 'APPROVE') {
      // Persist the verified profile onto the User inside a transaction so
      // a failure mid-write can't leave the User flagged as a dealer while
      // the verification row still reads PENDING (or vice-versa).
      await prisma.$transaction([
        prisma.user.update({
          where: { id: verification.userId },
          data: {
            role: 'TRADER',
            dealerVerified: true,
            dealerName: verification.dealerName,
            dealerLogo: verification.dealerLogo,
            dealerDescription: verification.dealerDescription,
            dealerAddress: verification.dealerAddress,
            dealerLat: verification.dealerLat,
            dealerLng: verification.dealerLng,
            dealerCommercialReg: verification.commercialReg,
          },
        }),
        prisma.traderVerification.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedBy: user.id,
            reviewedAt: now,
          },
        }),
      ]);
    } else {
      // REJECT — persist the rejectReason so we can show the applicant why.
      await prisma.traderVerification.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectReason: rejectReason || 'لم يحدد سبب',
          reviewedBy: user.id,
          reviewedAt: now,
        },
      });
    }

    return successResponse({ success: true });
  } catch (error) {
    console.error('traders-approval POST error:', error);
    return errorResponse('فشل معالجة الطلب', 500);
  }
}
