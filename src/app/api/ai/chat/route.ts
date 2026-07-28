import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/api';
import { chatCompletion, type ChatMessage } from '@/ai/nvidia-client';
import { getSystemPrompt, SITE_NAME, BRAND_PRICE_RANGES } from '@/ai/site-knowledge';

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
  if (/عائل|عائلي|كبير|عائلة|أطفال|طفال|van|suv/i.test(q)) filters.bodyType = { in: familyCars };
  if (/دفع رباعي|suv|تطعيس|بر|طرق وعرة/i.test(q)) filters.bodyType = { in: ['SUV', 'CROSSOVER'] };
  if (/اقتصاد|موفر|بنزين|مصروف|موفرة|اقتصادية/i.test(q)) filters.fuelType = { in: economyTypes };
  if (/(بي ام|bmw)/i.test(q)) filters.brand = { nameEn: { contains: 'bmw' } };
  if (/(مرسيدس|mercedes)/i.test(q)) filters.brand = { nameAr: { contains: 'مرسيدس' } };
  if (/(تويوتا|toyota)/i.test(q)) filters.brand = { nameAr: { contains: 'تويوتا' } };
  if (/(هوندا|honda)/i.test(q)) filters.brand = { nameEn: { contains: 'honda' } };
  if (/(كيا|kia)/i.test(q)) filters.brand = { nameAr: { contains: 'كيا' } };
  if (/(هيونداي|hyundai)/i.test(q)) filters.brand = { nameEn: { contains: 'hyundai' } };
  if (/(نيسان|nissan)/i.test(q)) filters.brand = { nameEn: { contains: 'nissan' } };
  return filters;
}

async function fetchCars(query: string) {
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
      where: filters as any, take: 10, orderBy: { createdAt: 'desc' },
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
      where: { status: 'APPROVED' }, take: 6, orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        city: { select: { nameAr: true } },
        images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
      },
    });
  }

  return cars;
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

    // Fetch relevant cars from DB
    const cars = await fetchCars(query);
    const budget = parseBudget(query);

    // Build car context for LLM
    const carContext = cars.length > 0
      ? cars.slice(0, 10).map((car: any, i: number) =>
        `${i + 1}. ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year} — ${car.price.toLocaleString()} د.أ | ${car.city?.nameAr || ''} | ${car.condition || ''} | ${car.kilometers.toLocaleString()} كم | refCode: ${car.refCode || 'N/A'}`
      ).join('\n')
      : 'لا توجد سيارات متاحة حالياً.';

    // Build brand price summary
    const brandSummary = Object.entries(BRAND_PRICE_RANGES).slice(0, 15).map(
      ([, data]) => `${data.nameAr}: ${data.min.toLocaleString()}-${data.max.toLocaleString()} د.أ`
    ).join('، ');

    const systemPrompt = `${getSystemPrompt('chat')}

السيارات المتاحة حالياً في الموقع:
${carContext}

نطاقات أسعار الماركات (ملخص): ${brandSummary}

${budget ? `الميزانية المطلوبة: ${budget.toLocaleString()} د.أ` : ''}

مهمتك:
1. إذا سأل المستخدم عن سيارة أو بحث، قدم له منتجات من DB أعلاه مع الأسعار.
2. إذا سأل عن ميزانية معينة، أعطه خيارات مناسبة.
3. إذا سأل عن ميزات الموقع أو أي سؤال عام، أجب بشكل منطقي ومفيد.
4. استخدم refCode للوصول السريع إذا توفر.
5. الإجابة يجب أن تكون بالعربية و منطقية ومفيدة.
6. لا تخترع معلومات — إذا لم تجد سيارة مناسبة، قل ذلك بوضوح.`;

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role || 'user', content: m.content })),
    ];

    let aiResponse = '';
    try {
      aiResponse = await chatCompletion(chatMessages, {
        temperature: 0.7,
        maxTokens: 2048,
      });
    } catch (llmError) {
      console.error('[AI Chat] LLM error, using fallback:', llmError);
      // Fallback to simple response
      if (cars.length > 0) {
        aiResponse = `وجدت ${cars.length} سيارة مناسبة لك:\n\n` +
          cars.slice(0, 6).map((car: any, i: number) =>
            `${i + 1}. **${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}**\n   💵 ${car.price.toLocaleString()} د.أ | 📍 ${car.city?.nameAr || ''} | 🏷️ ${car.refCode || ''}`
          ).join('\n\n') +
          `\n\nانسخ **رقم المرجع (refCode)** من أي سيارة وضعه في البحث للوصول السريع.`;
      } else {
        aiResponse = 'عذراً، ما لقيت سيارات متطابقة مع طلبك. جرب تغيير الميزانية أو نوع السيارة.';
      }
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

    return Response.json({ success: true, data: { message: aiResponse, cars: mappedCars } });
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
