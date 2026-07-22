import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const familyCars = ['SUV', 'CROSSOVER', 'VAN', 'MINIVAN', 'WAGON'];
const economyTypes = ['PETROL', 'HYBRID'];
const luxuryBrands = ['mercedes', 'bmw', 'audi', 'lexus', 'porsche', 'land-rover', 'jaguar'];

function parseBudget(query: string): number | null {
  const matches = query.match(/(\d[\d,]*)\s*(دينار|د\.أ|JOD|jod)/);
  if (matches) return parseInt(matches[1].replace(/,/g, ''));
  const numMatch = query.match(/(\d[\d,]*)/);
  if (numMatch) {
    const num = parseInt(numMatch[1].replace(/,/g, ''));
    if (num > 100 && num < 1000000) return num;
  }
  return null;
}

function parseNeeds(query: string): { isFamily: boolean; isEconomy: boolean; isLuxury: boolean; isSport: boolean; isSUV: boolean } {
  const q = query.toLowerCase();
  return {
    isFamily: /عائل|عائلي|كبير|عائلة|أطفال|طفال|van|suv/i.test(q),
    isEconomy: /اقتصاد|موفر|بنزين|مصروف|موفرة|اقتصادية/i.test(q),
    isLuxury: /فخم|فاخر|luxury|رفاه|ممتاز/i.test(q),
    isSport: /رياض|سباق|سريع|رياضي|sport/i.test(q),
    isSUV: /دفع رباعي|suv|تطعيس|بر|طرق وعرة/i.test(q),
  };
}

function getBrandNameAr(brand: { nameAr: string; nameEn: string }) {
  return brand.nameAr || brand.nameEn;
}

function getModelNameAr(model: { nameAr: string; nameEn: string }) {
  return model.nameAr || model.nameEn;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-purchase:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

    const { query } = await request.json();
    if (!query?.trim()) return errorResponse('الرجاء إدخال طلبك');

    const budget = parseBudget(query);
    const needs = parseNeeds(query);

    const where: Record<string, unknown> = { status: 'APPROVED' };

    if (budget) {
      where.price = { lte: budget + (budget > 5000 ? 3000 : 1000) };
    }

    if (needs.isFamily || needs.isSUV) {
      where.bodyType = needs.isSUV ? { in: ['SUV', 'CROSSOVER'] } : { in: familyCars };
    }

    if (needs.isEconomy) {
      where.fuelType = { in: economyTypes };
    }

    let cars = await prisma.car.findMany({
      where: where as any,
      take: 15,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        city: { select: { nameAr: true } },
        images: { take: 1, orderBy: { order: 'asc' } },
      },
    });

    if (cars.length === 0 && budget) {
      where.price = { gte: budget - 2000, lte: budget + 5000 };
      delete where.bodyType;
      if (needs.isEconomy) delete where.fuelType;
      cars = await prisma.car.findMany({
        where: where as any,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { nameAr: true, nameEn: true } },
          model: { select: { nameAr: true, nameEn: true } },
          city: { select: { nameAr: true } },
          images: { take: 1, orderBy: { order: 'asc' } },
        },
      });
    }

    if (cars.length === 0) {
      cars = await prisma.car.findMany({
        where: { status: 'APPROVED' },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { nameAr: true, nameEn: true } },
          model: { select: { nameAr: true, nameEn: true } },
          city: { select: { nameAr: true } },
          images: { take: 1, orderBy: { order: 'asc' } },
        },
      });
    }

    const recommendations = cars.map((car: any) => ({
      id: car.id,
      slug: car.slug,
      title: `${car.brand ? getBrandNameAr(car.brand) : ''} ${car.model ? getModelNameAr(car.model) : ''} ${car.year}`,
      price: car.price,
      year: car.year,
      kilometers: car.kilometers,
      fuelType: car.fuelType,
      transmission: car.transmission,
      condition: car.condition,
      image: car.images?.[0]?.url || null,
      city: car.city?.nameAr || '',
    }));

    let advice = '';
    if (budget && needs.isFamily) {
      advice = `ضمن ميزانية ${budget.toLocaleString()} دينار للسيارة العائلية، أنصحك بالتركيز على سيارات SUV عملية وموثوقة مثل تويوتا فورتشنر أو هيونداي توسان أو كيا سبورتاج.`;
    } else if (budget && needs.isEconomy) {
      advice = `بميزانية ${budget.toLocaleString()} دينار، السيارات الاقتصادية الأفضل هي تويوتا كورولا، هيونداي إلنترا، أو كيا سيراتو.`;
    } else if (budget) {
      advice = `ضمن ميزانية ${budget.toLocaleString()} دينار، هذه أفضل الخيارات المتاحة حالياً:`;
    } else if (needs.isFamily) {
      advice = 'إليك أفضل السيارات العائلية المتاحة حالياً في الموقع:';
    } else {
      advice = 'إليك بعض الخيارات المقترحة لك:';
    }

    return successResponse({ recommendations, advice, needs, budget });
  } catch (error) {
    return errorResponse('فشل تحليل الطلب', 500);
  }
}
