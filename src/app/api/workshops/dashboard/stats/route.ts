import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const [appointmentCount, reviewCount] = await Promise.all([
      prisma.workshopAppointment.count({ where: { workshopId: workshop.id } }),
      prisma.workshopReview.count({ where: { workshopId: workshop.id } }),
    ]);

    return successResponse({
      views: workshop.viewCount,
      messages: workshop.messageCount,
      appointments: appointmentCount,
      calls: workshop.callCount,
      carsFixed: workshop.carFixedCount,
      rating: workshop.rating,
      reviewCount,
    });
  } catch (error) {
    console.error('Workshop stats error:', error);
    return errorResponse('فشل تحميل الإحصائيات', 500);
  }
}
