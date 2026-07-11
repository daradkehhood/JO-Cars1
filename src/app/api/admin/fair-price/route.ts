import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { recalculateAllFairPrices } from '@/lib/fair-price';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const total = await prisma.car.count({ where: { status: 'APPROVED', deletedAt: null } });
    const withEstimate = await prisma.car.count({ where: { status: 'APPROVED', deletedAt: null, fairPriceEstimate: { not: null } } });
    const withoutEstimate = total - withEstimate;

    return successResponse({
      total,
      withEstimate,
      withoutEstimate,
      thresholds: { belowMarket: -8, aboveMarket: 8 },
    });
  } catch (e) {
    return errorResponse('فشل تحميل البيانات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const done = await recalculateAllFairPrices();
    return successResponse({ recalculated: done });
  } catch (e) {
    return errorResponse('فشل إعادة الحساب', 500);
  }
}
