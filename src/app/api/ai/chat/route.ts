import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/api';
import { chatCompletion, type ChatMessage, type AIModelId, DEFAULT_MODEL } from '@/ai/nvidia-client';
import { fetchOpenSooqListings } from '@/lib/opensooq-scrape';
import { getCachedResponse, setCachedResponse } from '@/ai/chat-cache';
import {
  getSystemPrompt, SITE_NAME, SITE_URL, BRAND_PRICE_RANGES,
  INTENT_PATTERNS, CAR_SEARCH_KEYWORDS, DIALECT_MAP,
  NAVIGATION_PAGES, type NavigationPage,
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
type Intent = 'car_search' | 'workshop' | 'parts' | 'price_analysis' | 'engine_sound' | 'selling' | 'site_info' | 'ref_code' | 'navigation' | 'general';

function detectIntent(query: string): Intent {
  const q = query.toLowerCase();
  // Check for ref code pattern (e.g., S44-XBY, A12-ABC, X99-ZZZ)
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

// ── Extract ref code from query ──
function extractRefCode(query: string): string | null {
  const match = query.trim().match(/([A-Z]{1,3}\d{1,4}-[A-Z]{3})/i);
  return match ? match[1].toUpperCase() : null;
}

// ── Navigation: detect target page from user query ──
function detectTargetPage(query: string): NavigationPage | null {
  // Normalize Arabic: ة→ه, أ/إ/آ→ا, ى→ي
  const normalize = (s: string) => s
    .toLowerCase()
    .replace(/[\u0629]/g, 'ه')   // ة marbuta → ه
    .replace(/[\u0621\u0622\u0623\u0625]/g, 'ا') // أ إ آ → ا
    .replace(/[\u0649]/g, 'ي')   // ى → ي
    .trim();
  const q = normalize(query);

  // Direct URL match
  const urlMatch = q.match(/\/([a-z\-\/]+)/i);
  if (urlMatch) {
    const path = '/' + urlMatch[1];
    const found = NAVIGATION_PAGES.find(p => p.url === path);
    if (found) return found;
  }

  // Score each page by keyword matches
  let bestMatch: NavigationPage | null = null;
  let bestScore = 0;

  for (const page of NAVIGATION_PAGES) {
    let score = 0;
    for (const keyword of page.keywords) {
      const kw = normalize(keyword);
      if (q.includes(kw)) {
        score += kw.length;
      }
    }
    if (q.includes(normalize(page.labelAr))) {
      score += page.labelAr.length + 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = page;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
}

// ── Fetch car by ref code with full details (optimized) ──
async function fetchCarByRefCode(refCode: string) {
  const car = await prisma.car.findUnique({
    where: { refCode },
    select: {
      id: true, slug: true, refCode: true, price: true, year: true, kilometers: true,
      fuelType: true, transmission: true, condition: true, bodyType: true,
      isNegotiable: true, hasWarranty: true, hasServiceHistory: true,
      isPaintOriginal: true, isDamaged: true, ownerCount: true, aiScore: true,
      brand: { select: { nameAr: true, nameEn: true } },
      model: { select: { nameAr: true, nameEn: true } },
      city: { select: { nameAr: true } },
      images: { orderBy: { order: 'asc' }, select: { url: true, order: true }, take: 5 },
      user: { select: { name: true, image: true, _count: { select: { cars: true } } } },
      carReviews: { select: { rating: true, comment: true }, take: 3 }, // Reduced from 5
    },
  });
  return car;
}

// ── Find similar cars for comparison (optimized) ──
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
    take: 3, // Reduced from 5
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

// ── Build full car report ──
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

  // Market comparison
  const sameModelListings = marketListings.filter(l =>
    l.title?.toLowerCase().includes(car.model?.nameEn?.toLowerCase() || '')
  );
  const marketPrices = sameModelListings.filter(l => l.price > 0).map(l => l.price);
  const sitePrices = similarCars.filter(s => s.price > 0).map(s => s.price);
  const allPrices = [...marketPrices, ...sitePrices, car.price].filter(p => p > 0);
  const avgPrice = allPrices.length > 0 ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length) : 0;
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

  let priceVerdict = '';
  let priceEmoji = '';
  if (avgPrice > 0) {
    const diff = ((car.price - avgPrice) / avgPrice) * 100;
    if (diff < -10) { priceVerdict = 'منخفض 🟢'; priceEmoji = '🟢'; }
    else if (diff > 10) { priceVerdict = 'مرتفع 🔴'; priceEmoji = '🔴'; }
    else { priceVerdict = 'عادل 🟡'; priceEmoji = '🟡'; }
  }

  // AI score
  const aiScore = car.aiScore || null;
  let scoreEmoji = '';
  if (aiScore) {
    if (aiScore >= 80) scoreEmoji = '🟢';
    else if (aiScore >= 60) scoreEmoji = '🟡';
    else scoreEmoji = '🔴';
  }

  // Owner count warning
  const ownerWarning = car.ownerCount > 2 ? '\n⚠️ تنبيه: السيارة تغيرت بين أكثر من 2 مالك' : '';

  // Features list
  const features: string[] = [];
  if (car.isNegotiable) features.push('💰 قابل للتفاوض');
  if (car.hasWarranty) features.push('🛡️ يوجد ضمان');
  if (car.hasServiceHistory) features.push('📄 تاريخ صيانة');
  if (car.isPaintOriginal) features.push('🎨 طلاء أصلي');
  if (!car.isDamaged) features.push('✅ بدون أضرار');

  const report = `🚗 **تقرير سيارة كامل: ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **المواصفات:**
• الماركة: ${car.brand?.nameAr || ''} (${car.brand?.nameEn || ''})
• الموديل: ${car.model?.nameAr || ''} (${car.model?.nameEn || ''})
• السنة: ${car.year}
• الكيلومترات: ${car.kilometers?.toLocaleString() || 'غير محدد'} كم
• الوقود: ${fuelMap[car.fuelType] || car.fuelType || ''}
• الناقل: ${transMap[car.transmission] || car.transmission || ''}
• الحالة: ${conditionMap[car.condition] || car.condition || ''}
• نوع الهيكل: ${car.bodyType || 'غير محدد'}
• عدد الأسطوانات: ${car.cylinders || 'غير محدد'}
• الدفع: ${car.drivetrain || 'غير محدد'}
• عدد المالكين: ${car.ownerCount || 1}
${ownerWarning}

💰 **تحليل السعر:**
• السعر المعلن: **${car.price?.toLocaleString()} د.أ** ${car.isNegotiable ? '(قابل للتفاوض)' : ''}
${avgPrice > 0 ? `• متوسط الأسعار المشابهة: ${avgPrice.toLocaleString()} د.أ
• أدنى سعر: ${minPrice.toLocaleString()} د.أ
• أعلى سعر: ${maxPrice.toLocaleString()} د.أ
• تقييم السعر: **${priceVerdict}** مقارنة بالسوق (${marketPrices.length + sitePrices.length} إعلان مشابه)` : '• لا تتوفر بيانات كافية من السوق للمقارنة'}

${aiScore ? `📊 **تقييم الذكاء الاصطناعي: ${aiScore}/100** ${scoreEmoji}` : ''}

${features.length > 0 ? `✨ **المميزات:**\n${features.map(f => `• ${f}`).join('\n')}` : ''}

📍 **المدينة:** ${car.city?.nameAr || 'غير محددة'}
🏷️ **الرمز المرجعی:** ${car.refCode || 'غير متوفر'}
🔗 **رابط الإعلان:** ${SITE_URL}/cars/${car.slug || car.id}

👤 **البائع:** ${car.user?.name || 'غير معروف'} (${car.user?._count?.cars || 0} إعلانات)

${similarCars.length > 0 ? `🔍 **سيارات مشابهة في الموقع:**
${similarCars.slice(0, 4).map((s, i) => `${i + 1}. ${s.brand?.nameAr || ''} ${s.model?.nameAr || ''} ${s.year} — ${s.price?.toLocaleString()} د.أ | ${s.city?.nameAr || ''}`).join('\n')}` : ''}

💡 **توصيات قبل الشراء:**
1. 📞 تواصل مع البائع واستفسر عن الحالة الفعلية
2. 🔍 اطلب تقرير فحص فني من ورشة موثوقة
3. 🚗 اجرِ اختبار قيادة قبل الشراء
4. 📄 تأكد من أوراق السيارة (سجل، تأمين، ضريبة)
5. 💰 قارن السعر مع الإعلانات المشابهة أعلاه`;

  return report;
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

// ── Fetch cars from DB (optimized: minimal fields only) ──
async function fetchCars(query: string) {
  const filters = buildCarFilters(query);
  const budget = parseBudget(query);
  const selectFields = {
    id: true, slug: true, refCode: true, price: true, year: true, kilometers: true,
    fuelType: true, transmission: true, condition: true, bodyType: true,
    brand: { select: { nameAr: true, nameEn: true } },
    model: { select: { nameAr: true, nameEn: true } },
    city: { select: { nameAr: true } },
    images: { take: 1, orderBy: { order: 'asc' as const }, select: { url: true } },
  };

  let cars = await prisma.car.findMany({
    where: filters as any,
    take: 10, // Reduced from 15
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    select: selectFields,
  });

  if (cars.length === 0 && budget) {
    delete (filters as any).bodyType;
    delete (filters as any).fuelType;
    (filters as any).price = { gte: budget - 2000, lte: budget + 5000 };
    cars = await prisma.car.findMany({
      where: filters as any, take: 8, orderBy: { createdAt: 'desc' }, select: selectFields,
    });
  }

  if (cars.length === 0) {
    cars = await prisma.car.findMany({
      where: { status: 'APPROVED' }, take: 5, orderBy: { createdAt: 'desc' }, select: selectFields,
    });
  }

  return cars;
}

// ── Fetch workshops from DB (optimized: minimal fields only) ──
async function fetchWorkshops(query: string) {
  const city = parseCity(query);
  const where: Record<string, unknown> = {
    isPaused: false,
    isBanned: false,
  };

  const workshops = await prisma.workshop.findMany({
    where: where as any,
    take: 6, // Reduced from 10
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    select: {
      id: true, name: true, address: true, rating: true, reviewCount: true,
      services: { select: { category: true }, take: 5 },
      brands: { select: { brand: true }, take: 5 },
    },
  });

  if (city) {
    return workshops.filter((w: any) => {
      const addr = (w.address || '').toLowerCase();
      return addr.includes(city.toLowerCase()) || addr.includes(city);
    });
  }

  return workshops;
}

// ── Fetch used parts from DB (optimized: minimal fields only) ──
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
    take: 6, // Reduced from 10
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, price: true, condition: true,
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

  if (intent === 'ref_code') {
    return ['مقارنة السعر بالسوق', 'البحث عن ورشة فحص', 'قطع غيار للسيارة', 'مشابهات أخرى'];
  }
  if (intent === 'site_info') {
    return ['كيف أضيف إعلان؟', 'تقييم سعر سيارة', 'بحث عن سيارة', 'دليل الورش'];
  }
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
    suggestions.push('أضف إعلان مجاني');
  }

  // General suggestions
  if (suggestions.length === 0) {
    suggestions.push('بحث عن سيارة');
    suggestions.push('مساعد الشراء');
    suggestions.push('تقييم السعر');
    suggestions.push('دليل الورش');
  }

  return suggestions.slice(0, 4);
}

// ── Main POST handler ──
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-chat:${ip}`, RATE_LIMITS.AI_CHAT);
    if (!rateLimit.allowed) {
      return Response.json({
        success: true,
        data: {
          message: 'لقد تجاوزت حد الطلبات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
          cars: [],
          intent: 'general',
          suggestions: [],
          retryAfter: rateLimit.resetIn,
        },
      }, { status: 429 });
    }

    const { messages, sessionId, model: requestedModel, userName, userRole } = await request.json();
    const modelId: AIModelId = (requestedModel && ['glm', 'minimax', 'mistral', 'gpt-oss'].includes(requestedModel))
      ? requestedModel : DEFAULT_MODEL;
    const query = messages?.[messages.length - 1]?.content || '';
    if (!query.trim()) {
      return Response.json({ success: false, error: 'الرجاء إرسال رسالة' }, { status: 400 });
    }

    // Normalize dialect
    const normalizedQuery = normalizeDialect(query);

    // Detect intent
    const intent = detectIntent(normalizedQuery);

    // Check for ref code
    const refCode = extractRefCode(query);

    // Get or create conversation memory
    const sid = sessionId || `anon-${ip}`;
    const conversation = conversationStore.get(sid) || [];
    conversation.push({ role: 'user', content: query });
    if (conversation.length > MAX_CONVERSATION_LENGTH) conversation.shift();

    // Extract preferences from conversation history
    const conversationContext = conversation.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

    // ── REF CODE LOOKUP: fast path ──
    if (intent === 'ref_code' && refCode) {
      const car = await fetchCarByRefCode(refCode);
      if (!car) {
        const notFoundMsg = `لم أجد سيارة بالرمز المرجعي **${refCode}** في الموقع.\n\n💡 تأكد من صحة الرمز أو جرّب البحث بالاسم مثل: "كامري 2020" أو " toyota"`  ;
        conversation.push({ role: 'assistant', content: notFoundMsg });
        conversationStore.set(sid, conversation);
        return Response.json({
          success: true,
          data: { message: notFoundMsg, cars: [], intent: 'ref_code', suggestions: ['بحث عن سيارة', 'كيف أضيف إعلان؟'], sessionId: sid },
        });
      }

      // Fetch similar cars and market data for comparison
      const [similarCars, marketListings] = await Promise.all([
        findSimilarCars(car),
        fetchMarketListings(`${car.brand?.nameEn || ''} ${car.model?.nameEn || ''} ${car.year}`),
      ]);

      const report = buildCarReport(car, similarCars, marketListings);

      // Save to conversation
      conversation.push({ role: 'assistant', content: report });
      conversationStore.set(sid, conversation);

      const mappedCar = {
        id: car.id, slug: car.slug, refCode: car.refCode,
        title: `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`,
        price: car.price, year: car.year, kilometers: car.kilometers,
        fuelType: car.fuelType, transmission: car.transmission, condition: car.condition,
        image: car.images?.[0]?.url || null, city: car.city?.nameAr || '',
        brand: car.brand, model: car.model,
      };

      return Response.json({
        success: true,
        data: {
          message: report,
          cars: [mappedCar],
          intent: 'ref_code',
          suggestions: ['مقارنة السعر بالسوق', 'البحث عن ورشة فحص', 'قطع غيار للسيارة', 'مشابهات أخرى'],
          sessionId: sid,
        },
      });
    }

    // ── NAVIGATION: fast path ──
    if (intent === 'navigation') {
      const targetPage = detectTargetPage(normalizedQuery);
      if (targetPage) {
        if (targetPage.requiresAuth && !userName) {
          const authMsg = `🔒 هذه الصفحة "${targetPage.labelAr}" تتطلب تسجيل دخول.\n\nسأنقلك الآن لصفحة تسجيل الدخول...`;
          conversation.push({ role: 'assistant', content: authMsg });
          conversationStore.set(sid, conversation);
          return Response.json({
            success: true,
            data: {
              message: authMsg, cars: [], intent: 'navigation',
              navigate: { url: '/auth/login', label: 'تسجيل الدخول' },
              suggestions: ['إنشاء حساب جديد', 'العودة للرئيسية'], sessionId: sid,
            },
          });
        }
        if (targetPage.requiresAdmin && userRole !== 'ADMIN') {
          const adminMsg = `⛔ صفحة "${targetPage.labelAr}" متاحة فقط لمدير الموقع.`;
          conversation.push({ role: 'assistant', content: adminMsg });
          conversationStore.set(sid, conversation);
          return Response.json({
            success: true,
            data: { message: adminMsg, cars: [], intent: 'navigation', suggestions: ['العودة للرئيسية'], sessionId: sid },
          });
        }
        const successMsg = `✅ سأنقلك الآن إلى صفحة "${targetPage.labelAr}"...`;
        conversation.push({ role: 'assistant', content: successMsg });
        conversationStore.set(sid, conversation);
        return Response.json({
          success: true,
          data: {
            message: successMsg, cars: [], intent: 'navigation',
            navigate: { url: targetPage.url, label: targetPage.labelAr },
            suggestions: ['العودة للرئيسية', 'المساعد الذكي'], sessionId: sid,
          },
        });
      }
      const fallbackNavMsg = `🤔 أي صفحة تريد أن أخذك إليها؟\n\nأمثلة:\n- المفضلة\n- إعلاناتي\n- الجراج\n- ورش العمل\n- قطع الغيار\n- المنتدى\n- الملف الشخصي\n\nاكتب اسم الصفحة وسأنقلك لها مباشرة!`;
      conversation.push({ role: 'assistant', content: fallbackNavMsg });
      conversationStore.set(sid, conversation);
      return Response.json({
        success: true,
        data: {
          message: fallbackNavMsg, cars: [], intent: 'navigation',
          suggestions: ['المفضلة', 'إعلاناتي', 'الجراج', 'ورش العمل'], sessionId: sid,
        },
      });
    }

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

السيارات المتاحة (${cars.length} سيارة):
${carContext}

ورش العمل المتاحة (${workshops.length} ورشة):
${workshopContext}

قطع الغيار المتاحة (${parts.length} قطعة):
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
${userName ? `- اسم المستخدم: ${userName}` : ''}
${userRole ? `- دور المستخدم: ${userRole}` : ''}
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
8. **أظهر نسبة الثقة** — عند تقديم تحليل أسعار، أظهر نسبة الثقة في البيانات (مثلاً: "بناءً على 5 إعلانات من JO Cars + 8 إعلانات من السوق الخارجي، ثقة 85%").
9. **الرمز المرجعي** — إذا ذكر المستخدم رمزاً مثل S44-XBY، ابحث في البيانات وأعطِ تقريراً كاملاً.
10. **شرح الموقع** — إذا سأل المستخدم عن أي ميزة أو صفحة، أجب بشكل شامل مع روابط مباشرة.
11. **أمثلة عملية** — عند شرح أي ميزة، أعطِ مثالاً عملياً كيف يستخدمها.
12. **اسم المستخدم — مطلوب في كل رد** — **إلزامي**: إذا كان اسم المستخدم معروضاً في معلومات المستخدم، **يجب** استخدام اسمه في كل رد. مثال: "أهلاً [الاسم]!" أو "حسناً [الاسم]، إليك الإجابة...". لا تكرر الاسم أكثر من مرة واحدة في كل رد.
13. **تحية المدير — خاصة ومحترمة** — إذا كان دور المستخدم ADMIN: ابدأ الرد بـ "أهلاً وسهلاً بلمدير الموقع [الاسم]!" أو "مرحباً بك يا مدير". تعامل مع المدير باحترام وراحة أكبر وقدم معلومات إضافية.`;

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversation.slice(-6).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    // ── Check cache before calling NVIDIA API ──
    const cachedResponse = getCachedResponse(normalizedQuery, intent);
    let aiResponse = '';

    if (cachedResponse) {
      aiResponse = cachedResponse;
    } else {
      try {
        aiResponse = await chatCompletion(chatMessages, {
          temperature: 0.7,
          maxTokens: 2048,
          timeoutMs: 20000,
          retries: 2,
          modelId,
        });
        setCachedResponse(normalizedQuery, intent, aiResponse);
      } catch (llmError) {
        console.error('[AI Chat] LLM error, using fallback:', llmError);
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
    }

    // Save to conversation memory
    conversation.push({ role: 'assistant', content: aiResponse });
    if (conversation.length > MAX_CONVERSATION_LENGTH) conversation.shift();
    conversationStore.set(sid, conversation);

    // Map cars for response — only send when user explicitly asks for car search
    const mappedCars = (intent === 'car_search' || intent === 'ref_code' || intent === 'price_analysis')
      ? cars.map((car: any) => ({
          id: car.id, slug: car.slug, refCode: car.refCode,
          title: `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`,
          price: car.price, year: car.year, kilometers: car.kilometers,
          fuelType: car.fuelType, transmission: car.transmission, condition: car.condition,
          image: car.images?.[0]?.url || null, city: car.city?.nameAr || '',
          brand: car.brand, model: car.model,
        }))
      : [];

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
