import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const { type, targetId, reason, description } = body;

    if (!type || !reason) {
      return errorResponse('نوع البلاغ والسبب مطلوبان');
    }

    if (!['review', 'ad', 'workshop'].includes(type)) {
      return errorResponse('نوع البلاغ غير صحيح');
    }

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');

    const report = await prisma.workshopReport.create({
      data: {
        workshopId: id,
        userId: user.id,
        type,
        targetId: targetId || null,
        reason,
        description: description || null,
      },
    });

    return successResponse(report, 201);
  } catch (error) {
    console.error('Report creation error:', error);
    return errorResponse('فشل إرسال البلاغ', 500);
  }
}
