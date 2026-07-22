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

    const ad = await prisma.workshopAd.findFirst({
      where: { id, workshopId: workshop.id },
    });
    if (!ad) return notFoundResponse('الإعلان');

    await prisma.workshopAd.delete({ where: { id } });

    return successResponse({ message: 'تم حذف الإعلان بنجاح' });
  } catch (error) {
    console.error('Ad delete error:', error);
    return errorResponse('فشل حذف الإعلان', 500);
  }
}
