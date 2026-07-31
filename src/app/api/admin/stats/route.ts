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
      prisma.car.count({ where: { deletedAt: null } }),
      prisma.car.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.car.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.car.count({ where: { status: 'SOLD', deletedAt: null } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ['DEALER', 'TRADER'] } } }),
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
