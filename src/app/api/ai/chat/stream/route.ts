import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { chatCompletionStream, type ChatMessage } from '@/ai/nvidia-client';
import { fetchOpenSooqListings } from '@/lib/opensooq-scrape';
import { getCachedResponse, setCachedResponse } from '@/ai/chat-cache';
import {
  getSystemPrompt, SITE_NAME, SITE_URL, BRAND_PRICE_RANGES,
  INTENT_PATTERNS, CAR_SEARCH_KEYWORDS, DIALECT_MAP,
} from '@/ai/site-knowledge';
import {
  parseNaturalLanguageQuery, buildSearchUrl, buildWorkshopSearchUrl,
  buildPartsSearchUrl, formatParsedQuery, type ParsedSearchQuery,
} from '@/ai/nl-search';

// ── Shared conversation store (imported from chat/route.ts pattern) ──
const conversationStore = new Map<string, { role: string; content: string }[]>();
const CONVERSATION_TTL = 30 * 60 * 1000;
const MAX_CONVERSATION_LENGTH = 20;

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of conversationStore.entries()) {
    if ((val as any).__lastAccess && now - (val as any).__lastAccess > CONVERSATION_TTL) {
      conversationStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ── Intent Detection ──
type Intent = 'car_search' | 'workshop' | 'parts' | 'price_analysis' | 'engine_sound' | 'selling' | 'site_info' | 'ref_code' | 'general';

function detectIntent(query: string): Intent {
  const q = query.toLowerCase();
  if (/[A-Z]{1,3}\d{1,4}-[A-Z]{3}/i.test(q.trim()) || /^[A-Z]\d{2,3}-[A-Z]{3}$/i.test(q.trim())) {
    return 'ref_code';
  }
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(q)) return intent as Intent;
    }
  }
  return 'general';
}

function extractRefCode(query: string): string | null {
  const match = query.trim().match(/([A-Z]{1,3}\d{1,4}-[A-Z]{3})/i);
  return match ? match[1].toUpperCase() : null;
}

function normalizeDialect(query: string): string {
  let result = query;
  for (const [dialect, msa] of Object.entries(DIALECT_MAP)) {
    result = result.replace(new RegExp(dialect, 'gi'), msa);
  }
  return result;
}

function parseBudget(query: string): number | null {
  const match = query.match(/(\d[\d,]*)\s*(?:دينار|د\.أ|ألف|الف|k|K)/i)
    || query.match(/(?:ميزانية|مبلغ|بـ|بسعر|بمبلغ)\s*(\d[\d,]*)/i);
  if (match) {
    let num = parseInt(match[1].replace(/,/g, ''));
    if (/\b(?:ألف|الف|k|K)\b/i.test(query) && num < 1000) num *= 1000;
    if (num >= 500 && num <= 500000) return num;
  }
  return null;
}

function parseCity(query: string): string | null {
  const cities = ['عمان', 'الزرقاء', 'إربد', 'السلط', 'العقبة', 'المفرق', 'الكرك', 'معان', 'جرش', 'عجلون'];
  for (const city of cities) {
    if (query.includes(city)) return city;
  }
  return null;
}

function extractBrand(query: string): string | null {
  const q = query.toLowerCase();
  for (const [key, data] of Object.entries(BRAND_PRICE_RANGES)) {
    if (q.includes(key) || q.includes(data.nameAr)) return key;
  }
  return null;
}

// ── DB Fetch Functions (optimized) ──
async function fetchCars(query: string) {
  const q = query.toLowerCase();
  const where: any = { status: 'APPROVED' };

  for (const [key, data] of Object.entries(BRAND_PRICE_RANGES)) {
    if (q.includes(key) || q.includes(data.nameAr)) {
      where.brand = { nameEn: key };
      break;
    }
  }

  return prisma.car.findMany({
    where,
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, slug: true, refCode: true, price: true, year: true, kilometers: true,
      fuelType: true, transmission: true, condition: true, bodyType: true,
      brand: { select: { nameAr: true, nameEn: true } },
      model: { select: { nameAr: true, nameEn: true } },
      city: { select: { nameAr: true } },
      images: { take: 1, select: { url: true } },
    },
  });
}

async function fetchWorkshops(query: string) {
  return prisma.workshop.findMany({
    where: { isPaused: false, isBanned: false },
    take: 6,
    orderBy: { rating: 'desc' },
    select: {
      id: true, name: true, address: true, rating: true, reviewCount: true, phone: true,
      services: { select: { category: true } },
      brands: { select: { brand: true } },
    },
  });
}

async function fetchParts(query: string) {
  return prisma.usedPart.findMany({
    where: { status: 'APPROVED' },
    take: 6,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, price: true, condition: true,
      brand: { select: { nameAr: true } },
      city: { select: { nameAr: true } },
      user: { select: { name: true } },
    },
  });
}

async function fetchCarByRefCode(refCode: string) {
  return prisma.car.findUnique({
    where: { refCode },
    select: {
      id: true, slug: true, refCode: true, price: true, year: true, kilometers: true,
      fuelType: true, transmission: true, condition: true, bodyType: true,
      isNegotiable: true, hasWarranty: true, hasServiceHistory: true,
      isPaintOriginal: true, isDamaged: true, ownerCount: true, aiScore: true,
      brand: { select: { nameAr: true, nameEn: true } },
      model: { select: { nameAr: true, nameEn: true } },
      city: { select: { nameAr: true } },
      images: { orderBy: { order: 'asc' as const }, select: { url: true, order: true }, take: 5 },
      user: { select: { name: true, image: true, _count: { select: { cars: true } } } },
      carReviews: { select: { rating: true, comment: true }, take: 3 },
    },
  });
}

async function findSimilarCars(car: any) {
  return prisma.car.findMany({
    where: {
      status: 'APPROVED',
      id: { not: car.id },
      OR: [
        { brand: { nameEn: car.brand?.nameEn } },
        { model: { nameEn: car.model?.nameEn } },
      ],
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, price: true, year: true,
      brand: { select: { nameAr: true } },
      model: { select: { nameAr: true } },
      city: { select: { nameAr: true } },
      images: { take: 1, select: { url: true } },
    },
  });
}

async function fetchMarketListings(query: string) {
  try {
    const brand = extractBrand(query);
    const modelMatch = query.match(/(?:كامري|كورلا|سنترا|باترول|سوناتا|إلنترا|توسان|سبورتاج)/i);
    const model = modelMatch ? modelMatch[0] : '';
    const yearMatch = query.match(/(20\d{2})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
    const result = await fetchOpenSooqListings(brand || query.split(' ')[0] || '', model, year);
    return result?.listings || [];
  } catch { return []; }
}

// ── Build Car Report ──
function buildCarReport(car: any, similarCars: any[], marketListings: any[]): string {
  const conditionMap: Record<string, string> = {
    EXCELLENT: 'ممتازة ✨', VERY_GOOD: 'جيدة جداً 👍', GOOD: 'جيدة 👌', FAIR: 'مقبولة 🤏',
  };
  const fuelMap: Record<string, string> = {
    PETROL: 'بنزين ⛽', DIESEL: 'ديزل 🛢️', HYBRID: 'هايبرد 🔋', ELECTRIC: 'كهربائية ⚡',
  };
  const transMap: Record<string, string> = {
    AUTOMATIC: 'أوتوماتيك 🔄', MANUAL: 'يدوي ✋',
  };

  const sameModelListings = marketListings.filter(l =>
    l.title?.toLowerCase().includes(car.model?.nameEn?.toLowerCase() || '')
  );
  const marketPrices = sameModelListings.filter(l => l.price > 0).map(l => l.price);
  const sitePrices = similarCars.filter(s => s.price > 0).map(s => s.price);
  const allPrices = [...marketPrices, ...sitePrices, car.price].filter(p => p > 0);
  const avgPrice = allPrices.length > 0 ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length) : 0;

  let priceVerdict = '';
  if (avgPrice > 0) {
    const diff = ((car.price - avgPrice) / avgPrice) * 100;
    if (diff < -10) priceVerdict = 'منخفض 🟢';
    else if (diff > 10) priceVerdict = 'مرتفع 🔴';
    else priceVerdict = 'عادل 🟡';
  }

  const aiScore = car.aiScore || null;
  let scoreEmoji = '';
  if (aiScore) {
    if (aiScore >= 80) scoreEmoji = '🟢';
    else if (aiScore >= 60) scoreEmoji = '🟡';
    else scoreEmoji = '🔴';
  }

  const features: string[] = [];
  if (car.isNegotiable) features.push('💰 قابل للتفاوض');
  if (car.hasWarranty) features.push('🛡️ يوجد ضمان');
  if (car.hasServiceHistory) features.push('📄 تاريخ صيانة');
  if (car.isPaintOriginal) features.push('🎨 طلاء أصلي');
  if (!car.isDamaged) features.push('✅ بدون أضرار');

  return `🚗 **تقرير سيارة كامل: ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **المواصفات:**
- 💵 السعر: ${car.price.toLocaleString()} د.أ ${car.isNegotiable ? '(قابل للتفاوض)' : ''}
- 📅 السنة: ${car.year}
- 🛣️ الممشى: ${car.kilometers.toLocaleString()} كم
- ⛽ الوقود: ${fuelMap[car.fuelType] || car.fuelType}
- 🔄 الناقل: ${transMap[car.transmission] || car.transmission}
- ⭐ الحالة: ${conditionMap[car.condition] || car.condition}
- 🏙️ المدينة: ${car.city?.nameAr || ''}
${car.ownerCount ? `- 👤 عدد المالكين: ${car.ownerCount}` : ''}
${aiScore ? `- 📊 تقييم AI: ${aiScore}/100 ${scoreEmoji}` : ''}

${features.length > 0 ? `✨ **المميزات:**\n${features.join('\n')}` : ''}

📊 **تحليل السعر:**
${avgPrice > 0 ? `- متوسط السوق: ${avgPrice.toLocaleString()} د.أ
- تقييم السعر: ${priceVerdict}
- عدد الإعلانات المشابهة: ${allPrices.length}` : '- لا توجد بيانات كافية'}

${similarCars.length > 0 ? `\n🔄 **سيارات مشابهة:**\n${similarCars.map((s, i) => `${i + 1}. ${s.brand?.nameAr || ''} ${s.model?.nameAr || ''} ${s.year} — ${s.price?.toLocaleString() || 'غير محدد'} د.أ`).join('\n')}` : ''}

💡 **نصيحة:** انسخ الرمز المرجعي **${car.refCode || 'N/A'}** واحتفظ به للرجوع السريع.`;
}

// ── Generate Suggestions ──
function generateSuggestions(intent: Intent, hasCars: boolean, hasWorkshops: boolean, hasParts: boolean): string[] {
  const suggestions: string[] = [];
  if (intent === 'ref_code') return ['مقارنة السعر بالسوق', 'البحث عن ورشة فحص', 'قطع غيار للسيارة', 'مشابهات أخرى'];
  if (intent === 'site_info') return ['كيف أضيف إعلان؟', 'تقييم سعر سيارة', 'بحث عن سيارة', 'دليل الورش'];
  if (intent === 'car_search' && hasCars) { suggestions.push('مقارنة الأسعار'); suggestions.push('تقييم حالة السيارة'); suggestions.push('البحث عن قطع غيار'); }
  if (intent === 'workshop' || hasWorkshops) { suggestions.push('حجز موعد'); suggestions.push('تقييمات الورش'); }
  if (intent === 'parts' || hasParts) { suggestions.push('قطع غيار أخرى'); suggestions.push('ورشة لتركيبها'); }
  if (intent === 'price_analysis') { suggestions.push('مقارنة مع سيارات مشابهة'); suggestions.push('تقييم الحالة'); }
  if (intent === 'engine_sound') { suggestions.push('تحليل صوت المحرك'); suggestions.push('ورشة صيانة'); }
  if (intent === 'selling') { suggestions.push('كيفية التسعير'); suggestions.push('نصائح للبيع'); suggestions.push('أضف إعلان مجاني'); }
  if (suggestions.length === 0) { suggestions.push('بحث عن سيارة'); suggestions.push('مساعد الشراء'); suggestions.push('تقييم السعر'); suggestions.push('دليل الورش'); }
  return suggestions.slice(0, 4);
}

// ── Build System Prompt with NL Search Context ──
function buildSystemPrompt(
  systemBase: string,
  carContext: string,
  workshopContext: string,
  partsContext: string,
  marketContext: string,
  marketAvg: number,
  marketMin: number,
  marketMax: number,
  marketListings: any[],
  budget: number | null,
  city: string | null,
  brand: string | null,
  intent: string,
  refCode: string | null,
  conversationContext: string,
  brandSummary: string,
  nlParsed: ParsedSearchQuery | null,
  searchUrl: string | null,
): string {
  let nlSection = '';
  if (nlParsed && nlParsed.confidence > 0.5) {
    nlSection = `
البحث باللغة الطبيعية:
- الاستعلام المفهرس: ${formatParsedQuery(nlParsed)}
- النية المكتشفة: ${nlParsed.intent} (ثقة: ${Math.round(nlParsed.confidence * 100)}%)
${nlParsed.brand ? `- الماركة: ${nlParsed.brand}` : ''}
${nlParsed.model ? `- الموديل: ${nlParsed.model}` : ''}
${nlParsed.year ? `- السنة: ${nlParsed.year.min}-${nlParsed.year.max}` : ''}
${nlParsed.price ? `- الميزانية: ${nlParsed.price.min}-${nlParsed.price.max} د.أ` : ''}
${nlParsed.city ? `- المدينة: ${nlParsed.city}` : ''}
${nlParsed.bodyType ? `- النوع: ${nlParsed.bodyType}` : ''}
${nlParsed.fuelType ? `- الوقود: ${nlParsed.fuelType}` : ''}
${nlParsed.transmission ? `- الناقل: ${nlParsed.transmission}` : ''}
${nlParsed.kilometers ? `- الممشى: أقل من ${nlParsed.kilometers.max} كم` : ''}
${searchUrl ? `- رابط النتائج: ${searchUrl}` : ''}`;
  }

  return `${systemBase}

البيانات المتوفرة من قاعدة البيانات:

السيارات المتاحة (${carContext === 'لا توجد سيارات متاحة حالياً.' ? '0' : carContext.split('\n').filter(Boolean).length} سيارة):
${carContext}

ورش العمل المتاحة (${workshopContext === 'لا توجد ورش متاحة حالياً.' ? '0' : workshopContext.split('\n').filter(Boolean).length} ورشة):
${workshopContext}

قطع الغيار المتاحة (${partsContext === 'لا توجد قطع غيار مطابقة حالياً.' ? '0' : partsContext.split('\n').filter(Boolean).length} قطعة):
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
${nlSection}
معلومات المستخدم:
- الميزانية: ${budget ? budget.toLocaleString() + ' د.أ' : 'غير محددة'}
- المدينة: ${city || 'غير محددة'}
- الماركة المفضلة: ${brand ? BRAND_PRICE_RANGES[brand]?.nameAr || brand : 'غير محددة'}
- النية المكتشفة: ${intent}
${refCode ? `- الرمز المرجعي المُدخل: ${refCode}` : ''}

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
8. **أظهر نسبة الثقة** — عند تقديم تحليل أسعار، أظهر نسبة الثقة في البيانات.
9. **الرمز المرجعي** — إذا ذكر المستخدم رمزاً مثل S44-XBY، ابحث في البيانات وأعطِ تقريراً كاملاً.
10. **شرح الموقع** — إذا سأل المستخدم عن أي ميزة أو صفحة، أجب بشكل شامل مع روابط مباشرة.
11. **أمثلة عملية** — عند شرح أي ميزة، أعطِ مثالاً عملياً كيف يستخدمها.
12. **البحث باللغة الطبيعية** — إذا فهمت البحث من كلام المستخدم الطبيعي، استخدم النتائج المفلترة واعرضها بوضوح.`;
}

// ── SSE POST Handler ──
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-chat-stream:${ip}`, RATE_LIMITS.AI_CHAT);
    if (!rateLimit.allowed) {
      return Response.json({
        success: true,
        data: {
          message: 'لقد تجاوزت حد الطلبات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
          cars: [], intent: 'general', suggestions: [], retryAfter: rateLimit.resetIn,
        },
      }, { status: 429 });
    }

    const { messages, sessionId } = await request.json();
    const query = messages?.[messages.length - 1]?.content || '';
    if (!query.trim()) {
      return Response.json({ success: false, error: 'الرجاء إرسال رسالة' }, { status: 400 });
    }

    const normalizedQuery = normalizeDialect(query);
    const intent = detectIntent(normalizedQuery);
    const refCode = extractRefCode(query);
    const sid = sessionId || `anon-${ip}`;
    const conversation = conversationStore.get(sid) || [];
    conversation.push({ role: 'user', content: query });
    if (conversation.length > MAX_CONVERSATION_LENGTH) conversation.shift();
    const conversationContext = conversation.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

    // Parse natural language query for search filters
    const nlParsed = parseNaturalLanguageQuery(query);
    const isNlSearch = nlParsed.confidence > 0.5 && (nlParsed.brand || nlParsed.model);
    const searchUrl = isNlSearch
      ? nlParsed.intent === 'workshop' ? buildWorkshopSearchUrl(nlParsed)
        : nlParsed.intent === 'parts' ? buildPartsSearchUrl(nlParsed)
        : buildSearchUrl(nlParsed, '/cars')
      : null;

    // ── REF CODE LOOKUP: fast path (non-streaming) ──
    if (intent === 'ref_code' && refCode) {
      const car = await fetchCarByRefCode(refCode);
      if (!car) {
        const notFoundMsg = `لم أجد سيارة بالرمز المرجعي **${refCode}** في الموقع.\n\n💡 تأكد من صحة الرمز أو جرّب البحث بالاسم مثل: "كامري 2020" أو "toyota"`;
        conversation.push({ role: 'assistant', content: notFoundMsg });
        conversationStore.set(sid, conversation);
        const mappedCar = null;
        return Response.json({
          success: true,
          data: { message: notFoundMsg, cars: [], intent: 'ref_code', suggestions: ['بحث عن سيارة', 'كيف أضيف إعلان؟'], sessionId: sid },
        });
      }

      const [similarCars, marketListings] = await Promise.all([
        findSimilarCars(car),
        fetchMarketListings(`${car.brand?.nameEn || ''} ${car.model?.nameEn || ''} ${car.year}`),
      ]);

      const report = buildCarReport(car, similarCars, marketListings);
      conversation.push({ role: 'assistant', content: report });
      conversationStore.set(sid, conversation);

      const mappedCar = {
        id: car.id, slug: car.slug, refCode: car.refCode,
        title: `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`,
        price: car.price, year: car.year, kilometers: car.kilometers,
        fuelType: car.fuelType, transmission: car.transmission, condition: car.condition,
        image: car.images?.[0]?.url || null, city: car.city?.nameAr || '',
      };

      return Response.json({
        success: true,
        data: { message: report, cars: [mappedCar], intent: 'ref_code', suggestions: ['مقارنة السعر بالسوق', 'البحث عن ورشة فحص'], sessionId: sid },
      });
    }

    // ── Fetch data in parallel ──
    const [cars, workshops, parts, marketListings] = await Promise.all([
      intent === 'car_search' || intent === 'price_analysis' || intent === 'general' || intent === 'engine_sound'
        ? fetchCars(normalizedQuery) : Promise.resolve([]),
      intent === 'workshop' || intent === 'general'
        ? fetchWorkshops(normalizedQuery) : Promise.resolve([]),
      intent === 'parts' || intent === 'general'
        ? fetchParts(normalizedQuery) : Promise.resolve([]),
      intent === 'price_analysis' || intent === 'car_search'
        ? fetchMarketListings(normalizedQuery) : Promise.resolve([]),
    ]);

    const budget = parseBudget(normalizedQuery);
    const city = parseCity(normalizedQuery);
    const brand = extractBrand(normalizedQuery);

    // Build context strings
    const carContext = cars.length > 0
      ? cars.slice(0, 10).map((car: any, i: number) =>
        `${i + 1}. ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year} — ${car.price.toLocaleString()} د.أ | ${car.city?.nameAr || ''} | ${car.condition || ''} | ${car.kilometers.toLocaleString()} كم | refCode: ${car.refCode || 'N/A'}`
      ).join('\n') : 'لا توجد سيارات متاحة حالياً.';

    const workshopContext = workshops.length > 0
      ? workshops.map((w: any, i: number) =>
        `${i + 1}. ${w.name} — ${w.address || ''} | تقييم: ${w.rating || 0}/5 (${w.reviewCount || 0} مراجعة) | خدمات: ${w.services?.map((s: any) => s.category).filter(Boolean).join('، ') || 'متنوعة'} | ماركات: ${w.brands?.map((b: any) => b.brand).filter(Boolean).join('، ') || 'جميع الماركات'}`
      ).join('\n') : 'لا توجد ورش متاحة حالياً.';

    const partsContext = parts.length > 0
      ? parts.map((p: any, i: number) =>
        `${i + 1}. ${p.title} — ${p.brand?.nameAr || ''} | السعر: ${p.price?.toLocaleString() || 'غير محدد'} د.أ | الحالة: ${p.condition || ''} | المدينة: ${p.city?.nameAr || ''}`
      ).join('\n') : 'لا توجد قطع غيار مطابقة حالياً.';

    const marketContext = marketListings.length > 0
      ? marketListings.slice(0, 8).map((l: any, i: number) =>
        `${i + 1}. ${l.title} — ${l.price?.toLocaleString() || 'غير محدد'} د.أ | ${l.year || ''} | ${l.km ? l.km.toLocaleString() + ' كم' : ''} | ${l.city || 'الاردن'}`
      ).join('\n') : 'لا تتوفر بيانات من السوق الخارجي حالياً.';

    const marketPrices = marketListings.filter((l: any) => l.price > 0).map((l: any) => l.price);
    const marketAvg = marketPrices.length > 0 ? Math.round(marketPrices.reduce((a: number, b: number) => a + b, 0) / marketPrices.length) : 0;
    const marketMin = marketPrices.length > 0 ? Math.min(...marketPrices) : 0;
    const marketMax = marketPrices.length > 0 ? Math.max(...marketPrices) : 0;

    const brandSummary = Object.entries(BRAND_PRICE_RANGES).slice(0, 15).map(
      ([, data]) => `${data.nameAr}: ${data.min.toLocaleString()}-${data.max.toLocaleString()} د.أ`
    ).join('، ');

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      getSystemPrompt('chat'),
      carContext, workshopContext, partsContext, marketContext,
      marketAvg, marketMin, marketMax, marketListings,
      budget, city, brand, intent, refCode,
      conversationContext, brandSummary,
      isNlSearch ? nlParsed : null, searchUrl,
    );

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversation.slice(-6).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    // ── Check cache first ──
    const cachedResponse = getCachedResponse(normalizedQuery, intent);

    // ── Create SSE stream ──
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendSSE = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        // Send metadata first
        sendSSE('meta', {
          intent,
          cars: cars.slice(0, 10).map((car: any) => ({
            id: car.id, slug: car.slug, refCode: car.refCode,
            title: `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`,
            price: car.price, year: car.year, kilometers: car.kilometers,
            fuelType: car.fuelType, transmission: car.transmission, condition: car.condition,
            image: car.images?.[0]?.url || null, city: car.city?.nameAr || '',
          })),
          suggestions: generateSuggestions(intent, cars.length > 0, workshops.length > 0, parts.length > 0),
          searchUrl: isNlSearch ? searchUrl : null,
          nlParsed: isNlSearch ? {
            brand: nlParsed.brand,
            model: nlParsed.model,
            year: nlParsed.year,
            price: nlParsed.price,
            city: nlParsed.city,
            bodyType: nlParsed.bodyType,
            confidence: nlParsed.confidence,
          } : null,
        });

        if (cachedResponse) {
          // Send cached response immediately
          sendSSE('token', { content: cachedResponse });
          sendSSE('done', {});
          controller.close();
          return;
        }

        // Stream AI response
        try {
          let fullResponse = '';
          for await (const chunk of chatCompletionStream(chatMessages, {
            temperature: 0.7,
            maxTokens: 2048,
            timeoutMs: 30000,
          })) {
            fullResponse += chunk;
            sendSSE('token', { content: chunk });
          }

          // Cache the response
          setCachedResponse(normalizedQuery, intent, fullResponse);

          // Save to conversation memory
          conversation.push({ role: 'assistant', content: fullResponse });
          if (conversation.length > MAX_CONVERSATION_LENGTH) conversation.shift();
          conversationStore.set(sid, conversation);

          sendSSE('done', { sessionId: sid });
        } catch (llmError) {
          console.error('[AI Chat Stream] LLM error:', llmError);
          // Fallback: send pre-built response
          let fallback = '';
          if (intent === 'car_search' && cars.length > 0) {
            fallback = `وجدت ${cars.length} سيارة مناسبة لك:\n\n` +
              cars.slice(0, 6).map((car: any, i: number) =>
                `${i + 1}. **${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}**\n   💵 ${car.price.toLocaleString()} د.أ | 📍 ${car.city?.nameAr || ''} | 🏷️ ${car.refCode || ''}`
              ).join('\n\n') +
              `\n\nانسخ **رقم المرجع (refCode)** من أي سيارة وضعه في البحث للوصول السريع.`;
          } else if (intent === 'workshop' && workshops.length > 0) {
            fallback = `وجدت ${workshops.length} ورشة:\n\n` +
              workshops.slice(0, 5).map((w: any, i: number) =>
                `${i + 1}. **${w.name}** — ${w.address || ''} | ⭐ ${w.rating || 0}/5 | ${w.services?.map((s: any) => s.category).filter(Boolean).join('، ') || 'متنوعة'}`
              ).join('\n\n');
          } else if (intent === 'parts' && parts.length > 0) {
            fallback = `وجدت ${parts.length} قطعة غيار:\n\n` +
              parts.slice(0, 5).map((p: any, i: number) =>
                `${i + 1}. **${p.title}** — ${p.brand?.nameAr || ''} | 💵 ${p.price?.toLocaleString() || 'غير محدد'} د.أ | 📍 ${p.city?.nameAr || ''}`
              ).join('\n\n');
          } else {
            fallback = 'عذراً، ما لقيت نتائج متطابقة مع طلبك. جرب تغيير الكلمات أو اسأل عن شيء آخر.';
          }
          sendSSE('token', { content: fallback });
          sendSSE('done', { sessionId: sid });

          conversation.push({ role: 'assistant', content: fallback });
          conversationStore.set(sid, conversation);
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return Response.json({
      success: true,
      data: { message: 'عذراً، حدث خطأ. جرب تكتب سؤالك بطريقة ثانية.', cars: [], intent: 'general', suggestions: ['بحث عن سيارة', 'مساعد شراء'] },
    });
  }
}
