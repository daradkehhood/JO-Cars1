import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workshop = await prisma.workshop.findUnique({
      where: { id },
      select: {
        viewCount: true,
        messageCount: true,
        appointmentCount: true,
        callCount: true,
        carFixedCount: true,
        rating: true,
        reviewCount: true,
        recommendPercent: true,
      },
    });

    if (!workshop) return notFoundResponse('الورشة');

    return successResponse(workshop);
  } catch (error) {
    console.error('Workshop stats error:', error);
    return errorResponse('فشل تحميل الإحصائيات', 500);
  }
}
