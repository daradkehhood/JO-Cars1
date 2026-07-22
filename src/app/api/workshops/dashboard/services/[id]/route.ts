import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const service = await prisma.workshopService.findFirst({
      where: { id, workshopId: workshop.id },
    });
    if (!service) return notFoundResponse('الخدمة');

    await prisma.workshopService.delete({ where: { id } });

    return successResponse({ message: 'تم حذف الخدمة بنجاح' });
  } catch (error) {
    console.error('Service delete error:', error);
    return errorResponse('فشل حذف الخدمة', 500);
  }
}
