import { NextRequest } from 'next/server';
import { priceEstimator } from '@/ai/price-estimator';
import { successResponse, errorResponse } from '@/lib/api';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, modelId, year, kilometers, condition, cityId } = body;

    const [brand, model, city] = await Promise.all([
      prisma.brand.findUnique({ where: { id: brandId } }),
      prisma.carModel.findUnique({ where: { id: modelId } }),
      prisma.city.findUnique({ where: { id: cityId } }),
    ]);

    const result = await priceEstimator.process({
      brand: brand?.nameAr || '',
      model: model?.nameAr || '',
      year: year || new Date().getFullYear(),
      kilometers: kilometers || 0,
      condition: condition || 'GOOD',
      city: city?.nameAr || '',
    });

    return successResponse(result.data);
  } catch (error) {
    console.error('Price estimate error:', error);
    return errorResponse('فشل تقدير السعر', 500);
  }
}
