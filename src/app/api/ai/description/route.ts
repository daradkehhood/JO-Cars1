import { NextRequest } from 'next/server';
import { descriptionGenerator } from '@/ai/description-generator';
import { successResponse, errorResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await descriptionGenerator.process({
      brand: body.brandName || '',
      model: body.modelName || '',
      year: body.year || new Date().getFullYear(),
      kilometers: body.kilometers || 0,
      fuelType: body.fuelType || '',
      transmission: body.transmission || '',
      color: body.color || '',
      condition: body.condition || '',
      price: body.price || 0,
      features: [],
      currentDescription: body.description,
    });

    return successResponse(result.data);
  } catch (error) {
    console.error('Description generation error:', error);
    return errorResponse('فشل تحسين الوصف', 500);
  }
}
