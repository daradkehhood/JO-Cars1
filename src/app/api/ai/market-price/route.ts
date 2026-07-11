import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

interface PriceStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
}

function calcStats(prices: number[]): PriceStats {
  if (prices.length === 0) return { min: 0, max: 0, avg: 0, median: 0, count: 0 };
  const sorted = [...prices].sort((a, b) => a - b);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return { min: sorted[0], max: sorted[sorted.length - 1], avg, median, count: prices.length };
}

function estimateConditionAdjustment(condition: string, km: number, year: number): number {
  const age = new Date().getFullYear() - year;
  const expectedKmPerYear = 20000;
  const expectedKm = age * expectedKmPerYear;
  const kmRatio = km / Math.max(expectedKm, 1);

  let base = 1.0;
  if (condition === 'ممتازة' || condition === 'EXCELLENT') base = 1.15;
  else if (condition === 'جيدة جداً' || condition === 'VERY_GOOD') base = 1.05;
  else if (condition === 'جيدة' || condition === 'GOOD') base = 0.95;
  else if (condition === 'مقبولة' || condition === 'FAIR') base = 0.85;

  if (kmRatio > 1.3) base -= 0.08;
  else if (kmRatio < 0.7) base += 0.05;

  return Math.round((base - 1) * 100);
}

function getPriceLabel(price: number, avg: number): { label: string; color: string } {
  const diff = ((price - avg) / avg) * 100;
  if (diff < -10) return { label: 'أقل من السوق 📉', color: 'text-green-500' };
  if (diff < 5) return { label: 'سعر السوق ✅', color: 'text-blue-500' };
  if (diff < 15) return { label: 'أعلى من السوق 📈', color: 'text-amber-500' };
  return { label: 'غالي مقارنة بالسوق 🔴', color: 'text-red-500' };
}

export async function POST(request: NextRequest) {
  try {
    const { brand, model, year, kilometers, condition } = await request.json();

    if (!brand || !year) {
      return Response.json({
        success: false,
        error: 'الرجاء إدخال الماركة وسنة الصنع على الأقل',
      }, { status: 400 });
    }

    const yearNum = parseInt(year);
    const kmNum = parseInt(kilometers) || 0;
    const yearRange = 2;

    const whereBrand: any = {
      status: 'APPROVED',
      year: { gte: yearNum - yearRange, lte: yearNum + yearRange },
    };

    whereBrand.OR = [
      { brand: { nameAr: { contains: brand } } },
      { brand: { nameEn: { contains: brand } } },
    ];

    let similarCars = await prisma.car.findMany({
      where: whereBrand,
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, price: true, year: true, kilometers: true, condition: true,
        fuelType: true, transmission: true, slug: true, refCode: true,
        createdAt: true,
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        city: { select: { nameAr: true } },
        images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
      },
    });

    if (model) {
      const modelFiltered = similarCars.filter(c =>
        (c.model?.nameAr || '').includes(model) || (c.model?.nameEn || '').includes(model)
      );
      if (modelFiltered.length >= 3) similarCars = modelFiltered;
    }

    if (similarCars.length === 0) {
      delete whereBrand.OR;
      whereBrand.brand = { nameAr: { contains: brand } };
      delete whereBrand.year;
      similarCars = await prisma.car.findMany({
        where: whereBrand,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, price: true, year: true, kilometers: true, condition: true,
          fuelType: true, transmission: true, slug: true, refCode: true,
          createdAt: true,
          brand: { select: { nameAr: true, nameEn: true } },
          model: { select: { nameAr: true, nameEn: true } },
          city: { select: { nameAr: true } },
          images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
        },
      });
    }

    const allPrices = similarCars.map(c => c.price);
    const stats = calcStats(allPrices);

    const recentSixMonths = similarCars.filter(c =>
      new Date(c.createdAt).getTime() > Date.now() - 180 * 24 * 60 * 60 * 1000
    );
    const olderCars = similarCars.filter(c =>
      new Date(c.createdAt).getTime() <= Date.now() - 180 * 24 * 60 * 60 * 1000
    );

    const recentStats = calcStats(recentSixMonths.map(c => c.price));
    const olderStats = calcStats(olderCars.map(c => c.price));

    let trend: { direction: string; percent: number; emoji: string };
    if (recentStats.count >= 3 && olderStats.count >= 3) {
      const change = ((recentStats.avg - olderStats.avg) / olderStats.avg) * 100;
      trend = {
        direction: change > 3 ? 'صاعد' : change < -3 ? 'هابط' : 'مستقر',
        percent: Math.abs(Math.round(change)),
        emoji: change > 3 ? '📈' : change < -3 ? '📉' : '➡️',
      };
    } else {
      trend = { direction: 'غير كافٍ للتحليل', percent: 0, emoji: '❓' };
    }

    const conditionAdj = estimateConditionAdjustment(condition || 'GOOD', kmNum, yearNum);
    const estimatedPrice = Math.round(stats.avg * (1 + conditionAdj / 100));
    const pricePosition = getPriceLabel(estimatedPrice, stats.avg);

    const latest = similarCars.slice(0, 8);

    return Response.json({
      success: true,
      data: {
        query: { brand, model: model || '', year: yearNum, kilometers: kmNum, condition: condition || '' },
        stats: {
          totalListings: stats.count,
          priceRange: { min: stats.min, max: stats.max, avg: stats.avg, median: stats.median },
          estimatedPrice,
          pricePosition,
          conditionAdjustment: conditionAdj,
        },
        trend,
        similarCars: latest.map(c => ({
          id: c.id, slug: c.slug, refCode: c.refCode,
          title: `${c.brand?.nameAr || ''} ${c.model?.nameAr || ''} ${c.year}`,
          price: c.price, year: c.year, kilometers: c.kilometers,
          condition: c.condition, fuelType: c.fuelType, transmission: c.transmission,
          image: c.images?.[0]?.url || null, city: c.city?.nameAr || '',
          createdAt: c.createdAt,
        })),
      },
    });
  } catch {
    return Response.json({
      success: false,
      error: 'عذراً، حدث خطأ أثناء تحليل السوق. حاول مرة أخرى.',
    }, { status: 500 });
  }
}
