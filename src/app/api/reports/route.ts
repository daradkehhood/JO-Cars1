import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { reportSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { notifyAdmins, getAdminNotifyLink } from '@/lib/admin-notify';
import { sendWhatsAppToAdmins, buildAdminMessage } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validation = reportSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const report = await prisma.report.create({
      data: {
        ...validation.data,
        userId: user.id,
        carId: body.carId,
      },
    });

    notifyAdmins('NEW_REPORT', 'بلاغ جديد', `تم تقديم بلاغ من ${user.name}: ${validation.data.reason}`, getAdminNotifyLink('NEW_REPORT'));
    sendWhatsAppToAdmins(buildAdminMessage('new_report', {
      reporterName: user.name, reason: validation.data.reason, carTitle: '',
    }));

    return successResponse(report, 201);
  } catch (error) {
    console.error('Report creation error:', error);
    return errorResponse('فشل إرسال البلاغ', 500);
  }
}
