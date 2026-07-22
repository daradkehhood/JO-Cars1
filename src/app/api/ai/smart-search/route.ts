import { NextRequest } from 'next/server';
import { smartSearch } from '@/ai/smart-search';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-search:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

    const { query } = await request.json();
    if (!query?.trim()) return errorResponse('الرجاء إدخال نص البحث');

    const result = await smartSearch.process({ query });
    const filters = result.data?.filters || {};

    const where: Record<string, unknown> = { status: 'APPROVED' };
    if (filters.bodyType) where.bodyType = filters.bodyType;
    if (filters.fuelType) where.fuelType = filters.fuelType;
    if (filters.transmission) where.transmission = filters.transmission;
    if (filters.priceMax) where.price = { lte: filters.priceMax };
    if (filters.isNew) where.isNew = true;

    const cars = await prisma.car.findMany({
      where: where as any,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: true, model: true, city: true,
        images: { take: 1, orderBy: { order: 'asc' } },
      },
    });

    return successResponse({ filters, cars, total: cars.length });
  } catch (error) {
    console.error('Smart search error:', error);
    return errorResponse('فشل البحث الذكي', 500);
  }
}
