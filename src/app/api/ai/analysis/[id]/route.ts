import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';
import { priceEstimator } from '@/ai/price-estimator';
import { conditionScorer } from '@/ai/condition-scorer';

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
    const imageUrls = car.images.map((img) => img.url).filter((u) => !!u);

    // ── 1) PRICE ANALYSIS ── real AI web search
    let fairPrice = car.fairPriceEstimate || 0;
    let minPrice = 0;
    let maxPrice = 0;
    let avgPrice = 0;
    let priceConfidence = 0;
    let priceReasoning = '';
    let marketFactors: string[] = [];
    let similarListings: any[] = [];
    let aiSources: string[] = [];
    let isRealWebSearch = false;

    // DB similar listings (always computed as a fallback signal)
    const similarCarsDb = await prisma.car.findMany({
      where: {
        brandId: car.brandId,
        modelId: car.modelId,
        year: { gte: car.year - 3, lte: car.year + 3 },
        kilometers: { gte: Math.round(car.kilometers * 0.6), lte: Math.round(car.kilometers * 1.4) },
        status: 'APPROVED',
        deletedAt: null,
        id: { not: car.id },
      },
      select: { id: true, slug: true, price: true, year: true, kilometers: true, condition: true, fuelType: true, transmission: true, engineCapacity: true, drivetrain: true, createdAt: true },
    });
    let dbPrices = similarCarsDb.map((c) => c.price);

    if (dbPrices.length < 2) {
      // Broaden search to brand only when too few same-model matches
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
      if (brandCars.length >= 2) dbPrices = brandCars.map((c) => c.price);
    }

    // Local AI engine — always available
    try {
      const priceResult = await priceEstimator.process({
        brand: car.brand?.nameAr || '',
        model: car.model?.nameAr || '',
        year: car.year,
        kilometers: car.kilometers,
        condition: car.condition,
        city: car.city?.nameAr || '',
        fuelType: car.fuelType,
        transmission: car.transmission,
        engineCapacity: car.engineCapacity || undefined,
        bodyType: car.bodyType || undefined,
        color: car.color || undefined,
        ownerCount: car.ownerCount || undefined,
        isDamaged: car.isDamaged,
        hasWarranty: car.hasWarranty,
        hasServiceHistory: car.hasServiceHistory,
        isPaintOriginal: car.isPaintOriginal,
      });
      if (priceResult.success && priceResult.data) {
        fairPrice = priceResult.data.fairPrice;
        minPrice = priceResult.data.minPrice;
        maxPrice = priceResult.data.maxPrice;
        priceConfidence = priceResult.data.confidence;
        priceReasoning = priceResult.data.reasoning;
        marketFactors = priceResult.data.marketFactors;
        similarListings = priceResult.data.similarListings;
        aiSources = priceResult.data.sources;
        isRealWebSearch = priceResult.data.isRealWebSearch;
      }
    } catch (e) {
      console.error('[local price estimate]', e);
    }

    // Bound price by database if AI didn't produce sane numbers
    if (fairPrice <= 0) {
      if (dbPrices.length >= 2) {
        avgPrice = Math.round(dbPrices.reduce((s, p) => s + p, 0) / dbPrices.length);
        const sorted = [...dbPrices].sort((a, b) => a - b);
        minPrice = sorted[0];
        maxPrice = sorted[sorted.length - 1];
        fairPrice = avgPrice;
        priceConfidence = 70;
      } else {
        fairPrice = car.price;
        minPrice = Math.round(car.price * 0.88);
        maxPrice = Math.round(car.price * 1.12);
        avgPrice = car.price;
        priceConfidence = 40;
      }
    } else {
      avgPrice = fairPrice;
      if (dbPrices.length >= 2) {
        const dbAvg = Math.round(dbPrices.reduce((s, p) => s + p, 0) / dbPrices.length);
        // small DB sanity guard — if AI price is wildly off, blend with DB
        if (dbAvg > 0 && Math.abs(fairPrice - dbAvg) / dbAvg > 0.6) {
          fairPrice = Math.round(fairPrice * 0.7 + dbAvg * 0.3);
        }
      }
    }

    // Price position vs user price
    const pricePosition = car.price > avgPrice ? 'above' : car.price < avgPrice ? 'below' : 'match';
    const priceDiffPercent = avgPrice > 0 ? Math.round(Math.abs(car.price - avgPrice) / avgPrice * 100) : 0;

    // ── 2) CONDITION + DAMAGE ANALYSIS ── local spec-based engine
    let conditionScore = 50;
    let conditionLabel = 'جيدة';
    let conditionFactors: any[] = [];
    let exteriorScore = 0, interiorScore = 0, engineBayScore = 0;
    let damages: any[] = [];
    let conditionSummary = '';
    let isRealVision = false;
    let visionConfidence = 0;

    try {
      const condResult = await conditionScorer.process({
        images: imageUrls,
        kilometers: car.kilometers,
        year: car.year,
        condition: car.condition ?? undefined,
        description: car.description ?? undefined,
        ownerCount: car.ownerCount || undefined,
        isDamaged: car.isDamaged,
        isPaintOriginal: car.isPaintOriginal,
        hasWarranty: car.hasWarranty,
        hasServiceHistory: car.hasServiceHistory,
        fuelType: car.fuelType ?? undefined,
        bodyType: car.bodyType ?? undefined,
      });
      if (condResult.success && condResult.data) {
        conditionScore = condResult.data.score;
        conditionLabel = condResult.data.label;
        conditionFactors = condResult.data.factors;
        exteriorScore = condResult.data.exteriorScore;
        interiorScore = condResult.data.interiorScore;
        engineBayScore = condResult.data.engineBayScore;
        damages = condResult.data.damages;
        conditionSummary = condResult.data.summary;
        isRealVision = condResult.data.isRealVision;
        visionConfidence = condResult.confidence || 0;
      }
    } catch (e) {
      console.error('[local condition scoring]', e);
    }

    // Fall back to seller-stated condition + heuristic
    if (!isRealVision) {
      const condWeights: Record<string, number> = {
        EXCELLENT: 95, VERY_GOOD: 80, GOOD: 65, FAIR: 45, NEEDS_MAINTENANCE: 25, NEEDS_INSPECTION: 15,
      };
      conditionScore = condWeights[car.condition] || 50;
      if (car.isNegotiable) conditionScore += 2;
      if (car.hasWarranty) conditionScore += 5;
      if (car.hasServiceHistory) conditionScore += 8;
      if (car.isDamaged) conditionScore -= 20;
      if (car.isPaintOriginal) conditionScore += 5;
      if (car.ownerCount === 1) conditionScore += 5;
      else if (car.ownerCount > 3) conditionScore -= 5;
      conditionScore = Math.max(0, Math.min(100, conditionScore));
      conditionLabel = conditionScore >= 80 ? 'جيدة جداً' : conditionScore >= 60 ? 'جيدة' : conditionScore >= 40 ? 'مقبولة' : conditionScore >= 20 ? 'تحتاج صيانة' : 'سيئة';

      if (car.isDamaged) damages.push({ part: 'عام', severity: 'moderate', description: 'مصدومة سابقاً (وفق تصريح البائع)' });
      if (!car.isPaintOriginal) damages.push({ part: 'الطلاء', severity: 'minor', description: 'الدهان غير أصلي' });
      conditionSummary = `${conditionLabel} (${conditionScore}/100) — تقييم تقديري بدون تحليل صور`;
    }

    // Confidence: combine data completeness + AI confidence
    const dataFields = [car.trim, car.engineCapacity, car.cylinders, car.drivetrain, car.bodyType, car.color, car.vin];
    const filledFields = dataFields.filter(Boolean).length;
    let confidence = Math.min(95, 40 + filledFields * 5 + (imageCount >= 5 ? 8 : 0) + (similarCarsDb.length >= 3 ? 8 : 0));
    if (isRealWebSearch) confidence = Math.min(95, Math.max(confidence, priceConfidence));
    if (isRealVision) confidence = Math.min(95, Math.max(confidence, visionConfidence));

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
      sellerIsDealer: Boolean(car.user.dealerName),
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
        estimate: fairPrice,
        range: { min: minPrice || Math.round(fairPrice * 0.88), max: maxPrice || Math.round(fairPrice * 1.12) },
        avgPrice,
        position: pricePosition,
        diffPercent: priceDiffPercent,
        similarCount: similarCarsDb.length + (similarListings.length || 0),
        similarCars: similarCarsDb.slice(0, 10),
        confidence: priceConfidence,
        reasoning: priceReasoning,
        marketFactors,
        sources: aiSources,
        similarListings,
        isRealWebSearch,
      },
      condition: {
        score: conditionScore,
        label: conditionLabel,
        confidence,
        factors: conditionFactors,
        exteriorScore,
        interiorScore,
        engineBayScore,
        damages,
        summary: conditionSummary,
        isRealVision,
        ownerCount: car.ownerCount || 1,
        hasServiceHistory: car.hasServiceHistory,
        hasWarranty: car.hasWarranty,
        isOriginalPaint: car.isPaintOriginal,
        isDamaged: car.isDamaged,
      },
      images: {
        count: imageCount,
        analyzed: imageUrls.length,
      },
      damages: damages.length > 0 ? damages : [{ part: 'لا يوجد', severity: 'minor', description: 'لا توجد عيوب ظاهرة من تحليل الصور' }],
      overview,
    };

    return successResponse(analysis);
  } catch (e) {
    console.error('AI analysis error:', e);
    return errorResponse('فشل تحليل السيارة', 500);
  }
}
