import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';
import { calculatePersonality, getPersonalityType } from '@/lib/ai/personality';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-personality:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

    const body = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers) || answers.length !== 5) {
      return errorResponse('إجابات غير صالحة', 400);
    }

    const dims = calculatePersonality(answers);
    const personality = getPersonalityType(dims);

    const where: any = { status: 'APPROVED' };

    const brandConditions: any[] = [];
    for (const brandName of personality.preferredBrands) {
      brandConditions.push(
        { brand: { nameEn: { contains: brandName, mode: 'insensitive' } } },
        { brand: { slug: { contains: brandName.toLowerCase() } } }
      );
    }

    const bodyTypeConditions = personality.bodyTypes.map(bt => ({ bodyType: bt }));

    where.OR = [
      { AND: [{ OR: bodyTypeConditions }, { OR: brandConditions.length > 0 ? brandConditions : [{ id: 'none' }] }] },
    ];

    const dbCars = await prisma.car.findMany({
      where,
      take: 6,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        city: { select: { nameAr: true } },
        images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
      },
    });

    let cars = dbCars.map((car) => ({
      id: car.id,
      slug: car.slug,
      refCode: car.refCode,
      title: `${car.brand.nameAr || car.brand.nameEn} ${car.model.nameAr || car.model.nameEn}`,
      price: car.price,
      year: car.year,
      kilometers: car.kilometers,
      fuelType: car.fuelType,
      transmission: car.transmission,
      condition: car.condition,
      image: car.images?.[0]?.url || null,
      city: car.city?.nameAr || '',
    }));

    if (cars.length < 3) {
      const fallbackWhere: any = { status: 'APPROVED' };
      if (personality.bodyTypes.length > 0) {
        fallbackWhere.bodyType = { in: personality.bodyTypes };
      }
      const fallbackCars = await prisma.car.findMany({
        where: fallbackWhere,
        take: 6,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        include: {
          brand: { select: { nameAr: true, nameEn: true } },
          model: { select: { nameAr: true, nameEn: true } },
          city: { select: { nameAr: true } },
          images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
        },
      });

      const existingIds = new Set(cars.map(c => c.id));
      const newCars = fallbackCars
        .filter(c => !existingIds.has(c.id))
        .map((car) => ({
          id: car.id,
          slug: car.slug,
          refCode: car.refCode,
          title: `${car.brand.nameAr || car.brand.nameEn} ${car.model.nameAr || car.model.nameEn}`,
          price: car.price,
          year: car.year,
          kilometers: car.kilometers,
          fuelType: car.fuelType,
          transmission: car.transmission,
          condition: car.condition,
          image: car.images?.[0]?.url || null,
          city: car.city?.nameAr || '',
        }));

      cars = [...cars, ...newCars].slice(0, 6);
    }

    return successResponse({
      personality: {
        type: personality.typeAr,
        typeEn: personality.typeEn,
        description: personality.description,
        emoji: personality.emoji,
        color: personality.color,
        dimensions: dims,
      },
      cars,
      recommendedCars: personality.recommendedCars,
    });
  } catch (error) {
    console.error('Personality match error:', error);
    return errorResponse('حدث خطأ في تحليل الشخصية', 500);
  }
}
