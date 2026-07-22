import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { searchCars } from '@/lib/ai/search-cars';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/api';

const familyCars = ['SUV', 'CROSSOVER', 'VAN', 'MINIVAN', 'WAGON'];
const economyTypes = ['PETROL', 'HYBRID'];

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

function queryToFilters(query: string): Record<string, unknown> {
  const q = query.toLowerCase();
  const filters: Record<string, unknown> = { status: 'APPROVED' };
  const budget = parseBudget(query);
  if (budget) filters.price = { lte: budget + (budget > 5000 ? 3000 : 1000) };
  if (/عائل|عائلي|كبير|عائلة|أطفال|طفال|van|suv/i.test(q)) {
    filters.bodyType = { in: familyCars };
  }
  if (/دفع رباعي|suv|تطعيس|بر|طرق وعرة/i.test(q)) {
    filters.bodyType = { in: ['SUV', 'CROSSOVER'] };
  }
  if (/اقتصاد|موفر|بنزين|مصروف|موفرة|اقتصادية/i.test(q)) {
    filters.fuelType = { in: economyTypes };
  }
  if (/(بي ام|bmw)/i.test(q)) filters.brand = { nameEn: { contains: 'bmw' } };
  if (/(مرسيدس|mercedes)/i.test(q)) filters.brand = { nameAr: { contains: 'مرسيدس' } };
  if (/(تويوتا|toyota)/i.test(q)) filters.brand = { nameAr: { contains: 'تويوتا' } };
  if (/(هوندا|honda)/i.test(q)) filters.brand = { nameEn: { contains: 'honda' } };
  if (/(كيا|kia)/i.test(q)) filters.brand = { nameAr: { contains: 'كيا' } };
  if (/(هيونداي|hyundai)/i.test(q)) filters.brand = { nameEn: { contains: 'hyundai' } };
  if (/(نيسان|nissan)/i.test(q)) filters.brand = { nameEn: { contains: 'nissan' } };
  return filters;
}

function formatResponse(query: string, cars: any[], budget: number | null): { message: string; cars: any[] } {
  if (cars.length === 0) {
    return {
      message: '🚗 عذراً، ما لقيت سيارات متطابقة مع طلبك. جرب تغيير الميزانية أو نوع السيارة.',
      cars: [],
    };
  }

  let intro = '';
  if (budget) {
    intro = `💰 ضمن ميزانية ${budget.toLocaleString()} دينار، وجدت ${cars.length} سيارة مناسبة:\n\n`;
  } else {
    intro = `🎯 وجدت ${cars.length} سيارة مناسبة لك:\n\n`;
  }

  const refCodeSuggest = 'انسخ **رقم المرجع (refCode)** من أي سيارة وضعه في البحث للوصول السريع';

  return {
    message: intro + cars.slice(0, 6).map((car: any, i: number) =>
      `${i + 1}. **${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}**\n` +
      `   💵 ${car.price.toLocaleString()} د.أ | 📍 ${car.city?.nameAr || ''} | 🏷️ ${car.refCode || ''}`
    ).join('\n') + `\n\n${refCodeSuggest}`,
    cars: cars.slice(0, 6),
  };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-chat:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

    const { messages } = await request.json();
    const query = messages?.[messages.length - 1]?.content || '';
    if (!query.trim()) {
      return Response.json({ success: false, error: 'الرجاء إرسال رسالة' }, { status: 400 });
    }

    const budget = parseBudget(query);
    const filters = queryToFilters(query);

    let cars = await prisma.car.findMany({
      where: filters as any,
      take: 15,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        city: { select: { nameAr: true } },
        images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
      },
    });

    if (cars.length === 0 && budget) {
      delete filters.bodyType;
      delete (filters as any).fuelType;
      (filters as any).price = { gte: budget - 2000, lte: budget + 5000 };
      cars = await prisma.car.findMany({
        where: filters as any,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { nameAr: true, nameEn: true } },
          model: { select: { nameAr: true, nameEn: true } },
          city: { select: { nameAr: true } },
          images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
        },
      });
    }

    if (cars.length === 0) {
      cars = await prisma.car.findMany({
        where: { status: 'APPROVED' },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { nameAr: true, nameEn: true } },
          model: { select: { nameAr: true, nameEn: true } },
          city: { select: { nameAr: true } },
          images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
        },
      });
    }

    const mappedCars = cars.map((car: any) => ({
      id: car.id,
      slug: car.slug,
      refCode: car.refCode,
      title: `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`,
      price: car.price,
      year: car.year,
      kilometers: car.kilometers,
      fuelType: car.fuelType,
      transmission: car.transmission,
      condition: car.condition,
      image: car.images?.[0]?.url || null,
      city: car.city?.nameAr || '',
      brand: car.brand,
      model: car.model,
    }));

    const result = formatResponse(query, cars, budget);
    return Response.json({ success: true, data: { ...result, cars: mappedCars } });
  } catch {
    return Response.json({
      success: true,
      data: {
        message: 'عذراً، حدث خطأ. جرب تكتب سؤالك بطريقة ثانية.',
        cars: [],
      },
    });
  }
}
