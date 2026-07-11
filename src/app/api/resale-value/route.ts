import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEPRECIATION_RATES: Record<string, { year1: number; year3: number; year5: number }> = {
  TOYOTA: { year1: 0.88, year3: 0.72, year5: 0.58 },
  HYUNDAI: { year1: 0.85, year3: 0.68, year5: 0.52 },
  KIA: { year1: 0.85, year3: 0.68, year5: 0.52 },
  NISSAN: { year1: 0.84, year3: 0.66, year5: 0.50 },
  HONDA: { year1: 0.87, year3: 0.70, year5: 0.55 },
  FORD: { year1: 0.82, year3: 0.64, year5: 0.48 },
  CHEVROLET: { year1: 0.82, year3: 0.64, year5: 0.48 },
  MERCEDES: { year1: 0.80, year3: 0.62, year5: 0.45 },
  BMW: { year1: 0.80, year3: 0.62, year5: 0.45 },
  AUDI: { year1: 0.80, year3: 0.62, year5: 0.45 },
  MAZDA: { year1: 0.84, year3: 0.66, year5: 0.50 },
  LEXUS: { year1: 0.85, year3: 0.70, year5: 0.55 },
  MITSUBISHI: { year1: 0.83, year3: 0.65, year5: 0.49 },
  SUZUKI: { year1: 0.83, year3: 0.65, year5: 0.49 },
  VOLKSWAGEN: { year1: 0.82, year3: 0.64, year5: 0.48 },
  PORSCHE: { year1: 0.85, year3: 0.72, year5: 0.58 },
  DEFAULT: { year1: 0.83, year3: 0.65, year5: 0.50 },
};

const FUEL_ADJUSTMENT: Record<string, number> = {
  ELECTRIC: 0.03,
  HYBRID: 0.02,
  DIESEL: -0.01,
  PETROL: 0,
};

const BODY_ADJUSTMENT: Record<string, number> = {
  SUV: 0.02,
  SEDAN: 0,
  HATCHBACK: -0.01,
  CROSSOVER: 0.01,
  PICKUP: 0.01,
  MINIVAN: -0.02,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, model, year, price, kilometers, fuelType, bodyType, condition } = body;

    const currentYear = new Date().getFullYear();
    const age = currentYear - (parseInt(year) || currentYear);

    const brandUpper = (brand || 'DEFAULT').toUpperCase();
    const rates = DEPRECIATION_RATES[brandUpper] || DEPRECIATION_RATES.DEFAULT;

    const fuelAdj = FUEL_ADJUSTMENT[fuelType] || 0;
    const bodyAdj = BODY_ADJUSTMENT[bodyType] || 0;

    const km = parseInt(kilometers) || 0;
    let kmPenalty = 0;
    if (km > 200000) kmPenalty = 0.15;
    else if (km > 150000) kmPenalty = 0.10;
    else if (km > 100000) kmPenalty = 0.05;
    else if (km > 50000) kmPenalty = 0.02;

    const conditionAdj = condition === 'EXCELLENT' ? 0.03 : condition === 'GOOD' ? 0 : condition === 'FAIR' ? -0.05 : -0.10;

    const basePrice = parseFloat(price) || 15000;

    const year1Rate = Math.min(0.95, Math.max(0.50, rates.year1 + fuelAdj + bodyAdj - kmPenalty + conditionAdj));
    const year3Rate = Math.min(0.90, Math.max(0.35, rates.year3 + fuelAdj + bodyAdj - kmPenalty - 0.03 + conditionAdj));
    const year5Rate = Math.min(0.80, Math.max(0.20, rates.year5 + fuelAdj + bodyAdj - kmPenalty - 0.05 + conditionAdj));

    const year1Value = Math.round(basePrice * year1Rate);
    const year3Value = Math.round(basePrice * year3Rate);
    const year5Value = Math.round(basePrice * year5Rate);

    const year1Loss = basePrice - year1Value;
    const year3Loss = basePrice - year3Value;
    const year5Loss = basePrice - year5Value;

    const year1LossPercent = Math.round((1 - year1Rate) * 100);
    const year3LossPercent = Math.round((1 - year3Rate) * 100);
    const year5LossPercent = Math.round((1 - year5Rate) * 100);

    const similarCars = await prisma.car.findMany({
      where: {
        status: 'ACTIVE',
        ...(brand ? { brand: { nameAr: { contains: brand, mode: 'insensitive' } } } : {}),
        ...(model ? { model: { nameAr: { contains: model, mode: 'insensitive' } } } : {}),
        year: { gte: currentYear - 3, lte: currentYear },
      },
      select: { price: true, year: true, kilometers: true },
      take: 10,
    });

    const avgMarketPrice = similarCars.length > 0
      ? Math.round(similarCars.reduce((a, b) => a + b.price, 0) / similarCars.length)
      : basePrice;

    const marketTrend = basePrice > avgMarketPrice ? 'above' : basePrice < avgMarketPrice ? 'below' : 'fair';

    let tips: string[] = [];
    if (kmPenalty > 0) tips.push('الكيلومترات العالية تقلل قيمة إعادة البيع');
    if (fuelType === 'HYBRID' || fuelType === 'ELECTRIC') tips.push('السيارات الهجينة/Kهربائية تحتفظ بقيمتها بشكل أفضل');
    if (bodyType === 'SUV') tips.push('سيارات SUV تحتفظ بقيمتها جيداً في السوق الأردني');
    if (age > 5) tips.push('السيارات الأقدم ت失lose قيمتها بشكل أسرع');
    if (condition === 'EXCELLENT') tips.push('الحالة الممتازة تزيد من القيمة');
    tips.push('الصيانة الدورية تحافظ على قيمة السيارة');
    tips.push('السوق الأردني يفضل ماركات تويوتا وهوندا وكيا');

    return NextResponse.json({
      success: true,
      data: {
        valuation: {
          currentPrice: basePrice,
          year1: { value: year1Value, loss: year1Loss, lossPercent: year1LossPercent },
          year3: { value: year3Value, loss: year3Loss, lossPercent: year3LossPercent },
          year5: { value: year5Value, loss: year5Loss, lossPercent: year5LossPercent },
        },
        market: {
          averagePrice: avgMarketPrice,
          similarListings: similarCars.length,
          trend: marketTrend,
        },
        factors: {
          brandReputation: brandUpper,
          fuelType: fuelType || 'غير محدد',
          bodyType: bodyType || 'غير محدد',
          age,
          kilometers: km,
        },
        tips,
      },
    });
  } catch (error) {
    console.error('Resale value error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 });
  }
}
