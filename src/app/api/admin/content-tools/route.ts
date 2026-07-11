import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { descriptionGenerator } from '@/ai/description-generator';
import { findDuplicateImages } from '@/lib/image-dedup';

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { action, carId } = body;

    if (action === 'generate-description') {
      const car = await prisma.car.findUnique({
        where: { id: carId },
        include: { brand: true, model: true, images: { take: 1 } },
      });
      if (!car) return errorResponse('السيارة غير موجودة', 404);

      const result = await descriptionGenerator.process({
        brand: car.brand?.nameAr || car.brand?.nameEn || '',
        model: car.model?.nameAr || car.model?.nameEn || '',
        year: car.year,
        kilometers: car.kilometers,
        fuelType: car.fuelType,
        transmission: car.transmission,
        color: car.color,
        condition: car.condition,
        price: car.price,
        features: [
          car.hasWarranty ? 'ضمان' : '',
          car.hasServiceHistory ? 'تاريخ صيانة' : '',
          car.isNegotiable ? 'قابل للتفاوض' : '',
          car.featured ? 'مميزة' : '',
        ].filter(Boolean),
        currentDescription: car.description,
      });

      if (result.success) {
        await prisma.car.update({
          where: { id: carId },
          data: { aiDescription: result.data.description },
        });
      }

      return successResponse(result.data);
    }

    if (action === 'check-duplicates') {
      const car = await prisma.car.findUnique({
        where: { id: carId },
        include: { brand: true, model: true, images: true },
      });
      if (!car || !car.images.length) return errorResponse('لا توجد صور', 404);

      const allResults: Record<string, unknown>[] = [];
      for (const img of car.images) {
        const duplicates = await findDuplicateImages(img.url, carId);
        if (duplicates.length > 0) {
          allResults.push({ image: img.url, duplicates });
        }
      }

      return successResponse({ totalImages: car.images.length, duplicatesFound: allResults.length, results: allResults });
    }

    return errorResponse('إجراء غير معروف');
  } catch (error) {
    console.error('Content tools error:', error);
    return errorResponse('فشل', 500);
  }
}
