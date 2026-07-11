import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const car = await prisma.car.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      include: {
        brand: { select: { id: true, nameAr: true, nameEn: true } },
        model: { select: { id: true, nameAr: true, nameEn: true } },
        city: { select: { id: true, nameAr: true, nameEn: true } },
        user: { select: { id: true, name: true, dealerName: true, rating: true, ratingCount: true, createdAt: true } },
        images: { select: { id: true, url: true, isCover: true }, orderBy: { order: 'asc' } },
        _count: { select: { carViews: true } },
      },
    });

    if (!car) return errorResponse('السيارة غير موجودة', 404);

    const imageCount = car.images.length;
    const totalViews = car.views + car._count.carViews;

    // Find similar cars from database
    const similarCars = await prisma.car.findMany({
      where: {
        brandId: car.brandId,
        modelId: car.modelId,
        year: { gte: car.year - 3, lte: car.year + 3 },
        kilometers: { gte: Math.round(car.kilometers * 0.6), lte: Math.round(car.kilometers * 1.4) },
        status: 'APPROVED',
        deletedAt: null,
        id: { not: car.id },
      },
      select: { price: true, year: true, kilometers: true, condition: true, fuelType: true, transmission: true, engineCapacity: true, drivetrain: true, createdAt: true },
    });

    // Market analysis
    let marketMin = car.price;
    let marketMax = car.price;
    let avgPrice = car.price;
    let similarCount = similarCars.length;

    if (similarCars.length >= 2) {
      const prices = similarCars.map(c => c.price).sort((a, b) => a - b);
      avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
      marketMin = prices[0];
      marketMax = prices[prices.length - 1];
    } else if (similarCars.length === 1) {
      avgPrice = similarCars[0].price;
      marketMin = Math.min(car.price, avgPrice);
      marketMax = Math.max(car.price, avgPrice);
    } else {
      // Broader search - brand only
      const brandCars = await prisma.car.findMany({
        where: {
          brandId: car.brandId,
          year: { gte: car.year - 5, lte: car.year + 5 },
          status: 'APPROVED',
          deletedAt: null,
          id: { not: car.id },
        },
        select: { price: true, year: true, kilometers: true },
      });
      similarCount = brandCars.length;
      if (brandCars.length >= 2) {
        const prices = brandCars.map(c => c.price).sort((a, b) => a - b);
        avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
        marketMin = prices[0];
        marketMax = prices[prices.length - 1];
      }
    }

    // Price position
    const pricePosition = car.price > avgPrice ? 'above' : car.price < avgPrice ? 'below' : 'match';
    const priceDiffPercent = avgPrice > 0 ? Math.round(Math.abs(car.price - avgPrice) / avgPrice * 100) : 0;

    // Condition score based on car data
    let conditionScore = 50;
    const conditionWeights: Record<string, number> = {
      EXCELLENT: 95, VERY_GOOD: 80, GOOD: 65, FAIR: 45, NEEDS_MAINTENANCE: 25, NEEDS_INSPECTION: 15,
    };
    conditionScore = conditionWeights[car.condition] || 50;

    // Adjust based on features
    if (car.isNegotiable) conditionScore += 2;
    if (car.hasWarranty) conditionScore += 5;
    if (car.hasServiceHistory) conditionScore += 8;
    if (car.isDamaged) conditionScore -= 20;
    if (car.isPaintOriginal) conditionScore += 5;
    if (car.ownerCount === 1) conditionScore += 5;
    else if (car.ownerCount > 3) conditionScore -= 5;
    if (car.fairPriceEstimate && car.price <= car.fairPriceEstimate) conditionScore += 3;

    conditionScore = Math.max(0, Math.min(100, conditionScore));

    // Damage analysis
    const damages: string[] = [];
    if (car.isDamaged) damages.push('مصدومة سابقاً (حسب إعلان البائع)');
    if (!car.isPaintOriginal) damages.push('الدهان غير أصلي');

    // Confidence based on data completeness
    const dataFields = [car.trim, car.engineCapacity, car.cylinders, car.drivetrain, car.bodyType, car.color, car.vin];
    const filledFields = dataFields.filter(Boolean).length;
    const confidence = Math.min(95, 50 + filledFields * 7 + (imageCount >= 5 ? 10 : 0) + (similarCars.length >= 3 ? 10 : 0));

    // Overview stats
    const overview = {
      views: totalViews,
      saves: car.saves,
      age: new Date().getFullYear() - car.year,
      transmission: car.transmission,
      fuelType: car.fuelType,
      drivetrain: car.drivetrain,
      sellerRating: car.user.rating,
      sellerRatingCount: car.user.ratingCount,
      sellerIsDealer: car.user.dealerName ? true : false,
      sellerMemberSince: car.user.createdAt,
    };

    const analysis = {
      car: {
        id: car.id,
        slug: car.slug,
        brand: car.brand?.nameAr,
        model: car.model?.nameAr,
        year: car.year,
        price: car.price,
        kilometers: car.kilometers,
        condition: car.condition,
        city: car.city?.nameAr,
        fuelType: car.fuelType,
        transmission: car.transmission,
        engineCapacity: car.engineCapacity,
        drivetrain: car.drivetrain,
        color: car.color,
        trim: car.trim,
        ownerCount: car.ownerCount || 1,
        isDamaged: car.isDamaged,
        isPaintOriginal: car.isPaintOriginal,
        hasServiceHistory: car.hasServiceHistory,
        hasWarranty: car.hasWarranty,
        isNegotiable: car.isNegotiable,
        fairPriceEstimate: car.fairPriceEstimate,
        description: car.description,
        aiDescription: car.aiDescription,
      },
      price: {
        estimate: car.fairPriceEstimate || avgPrice,
        range: { min: marketMin, max: marketMax },
        avgPrice,
        position: pricePosition,
        diffPercent: priceDiffPercent,
        similarCount,
        similarCars: similarCars.slice(0, 10),
      },
      condition: {
        score: conditionScore,
        label: conditionScore >= 80 ? 'ممتازة' : conditionScore >= 60 ? 'جيدة جداً' : conditionScore >= 40 ? 'جيدة' : conditionScore >= 20 ? 'مقبولة' : 'سيئة',
        confidence,
        ownerCount: car.ownerCount || 1,
        hasServiceHistory: car.hasServiceHistory,
        hasWarranty: car.hasWarranty,
        isOriginalPaint: car.isPaintOriginal,
        isDamaged: car.isDamaged,
      },
      images: {
        count: imageCount,
        analyzed: imageCount,
      },
      damages: damages.length > 0 ? damages : ['لا توجد عيوب مذكورة'],
      overview,
    };

    return successResponse(analysis);
  } catch (e) {
    console.error('AI analysis error:', e);
    return errorResponse('فشل تحليل السيارة', 500);
  }
}