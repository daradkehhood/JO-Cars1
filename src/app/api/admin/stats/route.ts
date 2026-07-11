import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, requireRole } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || !requireRole('ADMIN')(user)) return unauthorizedResponse();

  try {
    const [
      totalCars, activeCars, pendingCars, soldCars,
      totalUsers, totalDealers, totalViews, totalReports,
    ] = await Promise.all([
      prisma.car.count(),
      prisma.car.count({ where: { status: 'APPROVED' } }),
      prisma.car.count({ where: { status: 'PENDING' } }),
      prisma.car.count({ where: { status: 'SOLD' } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'DEALER' } }),
      prisma.car.aggregate({ _sum: { views: true } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    return successResponse({
      totalCars, activeCars, pendingCars, soldCars,
      totalUsers, totalDealers,
      totalViews: totalViews._sum.views || 0,
      totalReports,
      revenue: 0,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return errorResponse('فشل تحميل الإحصائيات', 500);
  }
}
