import { NextRequest } from 'next/server';
import { priceEstimator } from '@/ai/price-estimator';
import { isAIEnabled } from '@/ai/base';
import { successResponse, errorResponse } from '@/lib/api';
import prisma from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-price:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

    const body = await request.json();
    const { brandId, modelId, year, kilometers, condition, cityId, fuelType, transmission, engineCapacity, bodyType, color, ownerCount, isDamaged, hasWarranty, hasServiceHistory, isPaintOriginal } = body;

    const [brand, model, city] = await Promise.all([
      brandId ? prisma.brand.findUnique({ where: { id: brandId } }) : Promise.resolve(null),
      modelId ? prisma.carModel.findUnique({ where: { id: modelId } }) : Promise.resolve(null),
      cityId ? prisma.city.findUnique({ where: { id: cityId } }) : Promise.resolve(null),
    ]);

    const result = await priceEstimator.process({
      brand: brand?.nameAr || brand?.nameEn || '',
      model: model?.nameAr || model?.nameEn || '',
      year: year || new Date().getFullYear(),
      kilometers: kilometers || 0,
      condition: condition || 'GOOD',
      city: city?.nameAr || city?.nameEn || '',
      fuelType,
      transmission,
      engineCapacity,
      bodyType,
      color,
      ownerCount,
      isDamaged,
      hasWarranty,
      hasServiceHistory,
      isPaintOriginal,
    });

    // If AI is disabled, the estimator returns the heuristic fallback.
    // Mark this in the response so the UI can show "تقدير مبدئي".
    if (!isAIEnabled() && result.data) {
      (result.data as any).isRealWebSearch = false;
      (result.data as any).sources = ['تحليل محلي ذكي'];
    }

    return successResponse(result.data);
  } catch (error) {
    console.error('Price estimate error:', error);
    return errorResponse('فشل تقدير السعر', 500);
  }
}
