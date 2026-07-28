import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/api';
import { chatCompletion, type ChatMessage } from '@/ai/nvidia-client';
import { fetchOpenSooqListings } from '@/lib/opensooq-scrape';
import {
  getSystemPrompt, SITE_NAME, BRAND_PRICE_RANGES,
  INTENT_PATTERNS, CAR_SEARCH_KEYWORDS, DIALECT_MAP,
} from '@/ai/site-knowledge';

// ── In-memory conversation store (sessionId → messages) ──
const conversationStore = new Map<string, { role: string; content: string }[]>();
const CONVERSATION_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CONVERSATION_LENGTH = 20;

// Cleanup old conversations every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of conversationStore.entries()) {
    if ((val as any).__lastAccess && now - (val as any).__lastAccess > CONVERSATION_TTL) {
      conversationStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ── Intent Detection ──
type Intent = 'car_search' | 'workshop' | 'parts' | 'price_analysis' | 'engine_sound' | 'selling' | 'site_info' | 'general';

function detectIntent(query: string): Intent {
  const q = query.toLowerCase();
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(q)) return intent as Intent;
    }
  }
  return 'general';
}

// ── Normalize Arabic dialect to MSA ──
function normalizeDialect(query: string): string {
  let result = query;
  for (const [dialect, msa] of Object.entries(DIALECT_MAP)) {
    result = result.replace(new RegExp(dialect, 'gi'), msa);
  }
  return result;
}

// ── Budget parser ──
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

// ── City parser ──
function parseCity(query: string): string | null {
  const q = query.toLowerCase();
  for (const [city, aliases] of Object.entries(CAR_SEARCH_KEYWORDS.cities)) {
    for (const alias of aliases) {
      if (q.includes(alias)) return city;
    }
  }
  return null;
}

// ── Extract mentioned brand ──
function extractBrand(query: string): string | null {
  const q = query.toLowerCase();
  for (const [key, data] of Object.entries(BRAND_PRICE_RANGES)) {
    if (q.includes(key) || q.includes(data.nameAr.toLowerCase())) return key;
  }
  return null;
}

// ── Build car search filters from query ──
function buildCarFilters(query: string): Record<string, unknown> {
  const q = query.toLowerCase();
  const filters: Record<string, unknown> = { status: 'APPROVED' };
  const budget = parseBudget(query);
  if (budget) filters.price = { lte: budget + (budget > 5000 ? 3000 : 1000) };

  // Body type
  for (const [type, keywords] of Object.entries(CAR_SEARCH_KEYWORDS.bodyTypes)) {
    if (keywords.some(k => q.includes(k))) { filters.bodyType = { in: [type] }; break; }
  }

  // Fuel type
  for (const [type, keywords] of Object.entries(CAR_SEARCH_KEYWORDS.fuelTypes)) {
    if (keywords.some(k => q.includes(k))) { filters.fuelType = { in: [type] }; break; }
  }

  // Brand
  const brand = extractBrand(query);
  if (brand) {
    const brandData = BRAND_PRICE_RANGES[brand];
    if (brandData) {
      filters.OR = [
        { brand: { nameAr: { contains: brandData.nameAr } } },
        { brand: { nameEn: { contains: brand } } },
      ];
    }
  }

  return filters;
}

// ── Fetch cars from DB ──
async function fetchCars(query: string) {
  const filters = buildCarFilters(query);
  const budget = parseBudget(query);

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
    delete (filters as any).bodyType;
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

// ── Fetch workshops from DB ──
async function fetchWorkshops(query: string) {
  const city = parseCity(query);
  const where: Record<string, unknown> = {
    isPaused: false,
    isBanned: false,
  };

  const workshops = await prisma.workshop.findMany({
    where: where as any,
    take: 10,
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    include: {
      services: { select: { category: true, name: true } },
      brands: { select: { brand: true } },
      _count: { select: { reviews: true, appointments: true } },
    },
  });

  // Filter by city name if specified (since no relation exists)
  if (city) {
    return workshops.filter((w: any) => {
      const addr = (w.address || '').toLowerCase();
      return addr.includes(city.toLowerCase()) || addr.includes(city);
    });
  }

  return workshops;
}

// ── Fetch used parts from DB ──
async function fetchParts(query: string) {
  const parts = await prisma.usedPart.findMany({
    where: {
      status: 'APPROVED',
      OR: [
        { title: { contains: query } },
        { partType: { contains: query } },
        { brand: { nameAr: { contains: query } } },
        { brand: { nameEn: { contains: query } } },
      ],
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      brand: { select: { nameAr: true, nameEn: true } },
      city: { select: { nameAr: true } },
      user: { select: { name: true } },
    },
  });

  return parts;
}

// ── Fetch OpenSooq market listings for price queries ──
async function fetchMarketListings(query: string) {
  try {
    const brand = extractBrand(query);
    // Try to extract model from query
    const modelMatch = query.match(/(?:كوبرا|كامري|كورلا|سنترا|باترول|سوناتا|إلنترا|توسان|كيا|SPORTEGE|CERATO|RIO)/i);
    const model = modelMatch ? modelMatch[0] : '';

    // Try to extract year
    const yearMatch = query.match(/(20\d{2})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

    const result = await fetchOpenSooqListings(
      brand || query.split(' ')[0] || '',
      model,
      year
    );

    return result?.listings || [];
  } catch {
    return [];
  }
}

// ── Generate suggestion chips based on context ──
function generateSuggestions(intent: Intent, hasCars: boolean, hasWorkshops: boolean, hasParts: boolean): string[] {
  const suggestions: string[] = [];

  if (intent === 'car_search' && hasCars) {
    suggestions.push('مقارنة الأسعار');
    suggestions.push('تقييم حالة السيارة');
    suggestions.push('البحث عن قطع غيار');
  }
  if (intent === 'workshop' || hasWorkshops) {
    suggestions.push('حجز موعد');
    suggestions.push('تقييمات الورش');
  }
  if (intent === 'parts' || hasParts) {
    suggestions.push('قطع غيار أخرى');
    suggestions.push('ورشة لتركيبها');
  }
  if (intent === 'price_analysis') {
    suggestions.push('مقارنة مع سيارات مشابهة');
    suggestions.push('تقييم الحالة');
  }
  if (intent === 'engine_sound') {
    suggestions.push('تحليل صوت المحرك');
    suggestions.push('ورشة صيانة');
  }
  if (intent === 'selling') {
    suggestions.push('كيفية التسعير');
    suggestions.push('نصائح للبيع');
  }

  // General suggestions
  if (suggestions.length === 0) {
    suggestions.push('بحث عن سيارة');
    suggestions.push('دليل الورش');
    suggestions.push('قطع الغيار');
  }

  return suggestions.slice(0, 4);
}

// ── Main POST handler ──
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-chat:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

    const { messages, sessionId } = await request.json();
    const query = messages?.[messages.length - 1]?.content || '';
    if (!query.trim()) {
      return Response.json({ success: false, error: 'الرجاء إرسال رسالة' }, { status: 400 });
    }

    // Normalize dialect
    const normalizedQuery = normalizeDialect(query);

    // Detect intent
    const intent = detectIntent(normalizedQuery);

    // Get or create conversation memory
    const sid = sessionId || `anon-${ip}`;
    const conversation = conversationStore.get(sid) || [];
    conversation.push({ role: 'user', content: query });
    if (conversation.length > MAX_CONVERSATION_LENGTH) conversation.shift();

    // Extract preferences from conversation history
    const conversationContext = conversation.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

    // Parallel data fetch based on intent
    const [cars, workshops, parts, marketListings] = await Promise.all([
      intent === 'car_search' || intent === 'price_analysis' || intent === 'general' || intent === 'engine_sound'
        ? fetchCars(normalizedQuery)
        : Promise.resolve([]),
      intent === 'workshop' || intent === 'general'
        ? fetchWorkshops(normalizedQuery)
        : Promise.resolve([]),
      intent === 'parts' || intent === 'general'
        ? fetchParts(normalizedQuery)
        : Promise.resolve([]),
      intent === 'price_analysis' || intent === 'car_search'
        ? fetchMarketListings(normalizedQuery)
        : Promise.resolve([]),
    ]);

    const budget = parseBudget(normalizedQuery);
    const city = parseCity(normalizedQuery);
    const brand = extractBrand(normalizedQuery);

    // Build car context
    const carContext = cars.length > 0
      ? cars.slice(0, 10).map((car: any, i: number) =>
        `${i + 1}. ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year} — ${car.price.toLocaleString()} د.أ | ${car.city?.nameAr || ''} | ${car.condition || ''} | ${car.kilometers.toLocaleString()} كم | refCode: ${car.refCode || 'N/A'} | ID: ${car.id}`
      ).join('\n')
      : 'لا توجد سيارات متاحة حالياً.';

    // Build workshop context
    const workshopContext = workshops.length > 0
      ? workshops.map((w: any, i: number) =>
        `${i + 1}. ${w.name} — ${w.address || ''} | تقييم: ${w.rating || 0}/5 (${w.reviewCount || 0} مراجعة) | خدمات: ${w.services?.map((s: any) => s.category).filter(Boolean).join('، ') || 'متنوعة'} | ماركات: ${w.brands?.map((b: any) => b.brand).filter(Boolean).join('، ') || 'جميع الماركات'} | ID: ${w.id}`
      ).join('\n')
      : 'لا توجد ورش متاحة حالياً.';

    // Build parts context
    const partsContext = parts.length > 0
      ? parts.map((p: any, i: number) =>
        `${i + 1}. ${p.title} — ${p.brand?.nameAr || ''} | السعر: ${p.price?.toLocaleString() || 'غير محدد'} د.أ | الحالة: ${p.condition || ''} | المدينة: ${p.city?.nameAr || ''} | البائع: ${p.user?.name || ''}`
      ).join('\n')
      : 'لا توجد قطع غيار مطابقة حالياً.';

    // Build market listings context (OpenSooq)
    const marketContext = marketListings.length > 0
      ? marketListings.slice(0, 8).map((l: any, i: number) =>
        `${i + 1}. ${l.title} — ${l.price?.toLocaleString() || 'غير محدد'} د.أ | ${l.year || ''} | ${l.km ? l.km.toLocaleString() + ' كم' : ''} | ${l.city || 'الأردن'} — ${l.site || 'السوق الخارجي'}`
      ).join('\n')
      : 'لا تتوفر بيانات من السوق الخارجي حالياً.';

    // Calculate market stats
    const marketPrices = marketListings.filter((l: any) => l.price > 0).map((l: any) => l.price);
    const marketAvg = marketPrices.length > 0 ? Math.round(marketPrices.reduce((a: number, b: number) => a + b, 0) / marketPrices.length) : 0;
    const marketMin = marketPrices.length > 0 ? Math.min(...marketPrices) : 0;
    const marketMax = marketPrices.length > 0 ? Math.max(...marketPrices) : 0;

    // Build brand price summary
    const brandSummary = Object.entries(BRAND_PRICE_RANGES).slice(0, 15).map(
      ([, data]) => `${data.nameAr}: ${data.min.toLocaleString()}-${data.max.toLocaleString()} د.أ`
    ).join('، ');

    // Build enhanced system prompt
    const systemPrompt = `${getSystemPrompt('chat')}

البيانات المتوفرة من قاعدة البيانات:

السيارات المتاحة:
${carContext}

ورش العمل المتاحة:
${workshopContext}

قطع الغيار المتاحة:
${partsContext}

بيانات السوق الخارجي (أونصوك) - إعلانات مشابهة:
${marketContext}
${marketAvg > 0 ? `
إحصائيات السوق الخارجي:
- متوسط السعر: ${marketAvg.toLocaleString()} د.أ
- أدنى سعر: ${marketMin.toLocaleString()} د.أ
- أعلى سعر: ${marketMax.toLocaleString()} د.أ
- عدد الإعلانات: ${marketListings.length}` : ''}

نطاقات أسعار الماركات (ملخص): ${brandSummary}

معلومات المستخدم:
- الميزانية: ${budget ? budget.toLocaleString() + ' د.أ' : 'غير محددة'}
- المدينة: ${city || 'غير محددة'}
- الماركة المفضلة: ${brand ? BRAND_PRICE_RANGES[brand]?.nameAr || brand : 'غير محددة'}
- النية المكتشفة: ${intent}

المحادثة السابقة:
${conversationContext}

## قواعد مهمة جداً:
1. **لا تخترع معلومات** — إذا لم تجد سيارة/ورشة/قطعة في البيانات أعلاه، قل: "لا أملك هذه المعلومة حالياً في موقعنا".
2. **استخدم البيانات الحقيقية** — اذكر الأسعار والأرقام من البيانات أعلاه فقط.
3. **استخدم بيانات السوق الخارجي** — عند التحدث عن الأسعار، استخدم إحصائيات السوق الخارجي (أونصوك) لتقديم تحليل شامل.
4. **قدم اقتراحات** — بعد كل إجابة، اقترح إجراءات تالية.
5. **كن مختصراً** — لا تكتب فقرات طويلة.
6. **افهم النية** — افهم ما يريده المستخدم فعلاً.
7. **التقط الماركة والمدينة** — إذا ذكر المستخدم ماركة أو مدينة، ابحث بها.
8. **أظهر نسبة الثقة** — عند تقديم تحليل أسعار، أظهر نسبة الثقة في البيانات (مثلاً: "بناءً على 5 إعلانات من JO Cars + 8 إعلانات من السوق الخارجي، ثقة 85%").`;

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversation.slice(-6).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    let aiResponse = '';
    try {
      aiResponse = await chatCompletion(chatMessages, {
        temperature: 0.7,
        maxTokens: 2048,
      });
    } catch (llmError) {
      console.error('[AI Chat] LLM error, using fallback:', llmError);
      // Smart fallback based on intent
      if (intent === 'car_search' && cars.length > 0) {
        aiResponse = `وجدت ${cars.length} سيارة مناسبة لك:\n\n` +
          cars.slice(0, 6).map((car: any, i: number) =>
            `${i + 1}. **${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}**\n   💵 ${car.price.toLocaleString()} د.أ | 📍 ${car.city?.nameAr || ''} | 🏷️ ${car.refCode || ''}`
          ).join('\n\n') +
          `\n\nانسخ **رقم المرجع (refCode)** من أي سيارة وضعه في البحث للوصول السريع.`;
      } else if (intent === 'workshop' && workshops.length > 0) {
        aiResponse = `وجدت ${workshops.length} ورشة:\n\n` +
          workshops.slice(0, 5).map((w: any, i: number) =>
            `${i + 1}. **${w.name}** — ${w.address || ''} | ⭐ ${w.rating || 0}/5 | ${w.services?.map((s: any) => s.category).filter(Boolean).join('، ') || 'متنوعة'}`
          ).join('\n\n');
      } else if (intent === 'parts' && parts.length > 0) {
        aiResponse = `وجدت ${parts.length} قطعة غيار:\n\n` +
          parts.slice(0, 5).map((p: any, i: number) =>
            `${i + 1}. **${p.title}** — ${p.brand?.nameAr || ''} | 💵 ${p.price?.toLocaleString() || 'غير محدد'} د.أ | 📍 ${p.city?.nameAr || ''}`
          ).join('\n\n');
      } else {
        aiResponse = 'عذراً، ما لقيت نتائج متطابقة مع طلبك. جرب تغيير الكلمات أو اسأل عن شيء آخر.';
      }
    }

    // Save to conversation memory
    conversation.push({ role: 'assistant', content: aiResponse });
    if (conversation.length > MAX_CONVERSATION_LENGTH) conversation.shift();
    conversationStore.set(sid, conversation);

    // Map cars for response
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

    // Generate suggestion chips
    const suggestions = generateSuggestions(intent, cars.length > 0, workshops.length > 0, parts.length > 0);

    return Response.json({
      success: true,
      data: {
        message: aiResponse,
        cars: mappedCars,
        intent,
        suggestions,
        sessionId: sid,
        marketStats: marketListings.length > 0 ? {
          count: marketListings.length,
          avg: marketAvg,
          min: marketMin,
          max: marketMax,
          source: 'السوق الخارجي (أونصوك)',
        } : null,
      },
    });
  } catch {
    return Response.json({
      success: true,
      data: {
        message: 'عذراً، حدث خطأ. جرب تكتب سؤالك بطريقة ثانية.',
        cars: [],
        intent: 'general',
        suggestions: ['بحث عن سيارة', 'مساعد شراء'],
      },
    });
  }
}
