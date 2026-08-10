import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { chatCompletionStream, type ChatMessage, type AIModelId, DEFAULT_MODEL } from '@/ai/nvidia-client';
import { fetchOpenSooqListings } from '@/lib/opensooq-scrape';
import { getCachedResponse, setCachedResponse } from '@/ai/chat-cache';
import {
  getSystemPrompt, SITE_NAME, SITE_URL, BRAND_PRICE_RANGES,
  INTENT_PATTERNS, CAR_SEARCH_KEYWORDS, DIALECT_MAP,
  NAVIGATION_PAGES, type NavigationPage,
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
  for (const [key, val] of carFlowStore.entries()) {
    if (now - val.startedAt > CONVERSATION_TTL) {
      carFlowStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ── Car Listing Guided Flow ──
type CarFlowStep = 'brand' | 'model' | 'year_km' | 'fuel_trans' | 'color_drivetrain' | 'condition_price' | 'city_desc' | 'phone' | 'images' | 'done';
interface CarFlowState {
  step: CarFlowStep;
  data: Record<string, string>;
  images: string[]; // base64 data URIs
  startedAt: number;
}
const carFlowStore = new Map<string, CarFlowState>();

const CAR_FLOW_QUESTIONS: Record<CarFlowStep, { text: string; hint?: string }> = {
  brand: {
    text: '🚗 ممتاز! يلا نبدأ نسوي لك إعلان.\n\n**ما هي ماركة السيارة؟**\n\nأمثلة: تويوتا، هوندا، بي ام دبليو، مرسيدس، كيا، هيونداي',
    hint: 'ماركة السيارة (مثل: Toyota, Honda, BMW)',
  },
  model: {
    text: '✅ حلو!\n\n**ما هو موديل السيارة؟**\n\nأمثلة: كامري، كورولا، سنترا، X5، C200',
    hint: 'موديل السيارة (مثل: Camry, Corolla, X5)',
  },
  year_km: {
    text: '👍 تمام!\n\n**ما هي سنة الصنع؟**\n\n(مثل: 2020)',
    hint: 'سنة الصنع (مثل: 2020)',
  },
  fuel_trans: {
    text: '⛽ **ما نوع الوقود؟**\n\n1️⃣ بنزين\n2️⃣ ديزل\n3️⃣ هايبرد\n4️⃣ كهربائي\n5️⃣ PHEV',
    hint: 'اختر رقم: 1=بنزين, 2=ديزل, 3=هايبرد, 4=كهربائي, 5=PHEV',
  },
  color_drivetrain: {
    text: '🎨 **ما لون السيارة؟**',
    hint: 'لون السيارة (مثل: أبيض، أسود، فضي)',
  },
  condition_price: {
    text: '⭐ **ما حالة السيارة؟**\n\n1️⃣ ممتازة\n2️⃣ جيدة جداً\n3️⃣ جيدة\n4️⃣ مقبولة\n5️⃣ تحتاج صيانة\n6️⃣ تحتاج فحص',
    hint: 'حالة السيارة (1-6)',
  },
  city_desc: {
    text: '🏙️ **ما هي المحافظة؟**\n\nأمثلة: عمان، الزرقاء، إربد، السلط، العقبة',
    hint: 'اسم المحافظة',
  },
  phone: {
    text: '📞 **ما هو رقم الهاتف للتواصل؟**\n\n(رقم أردني يبدأ بـ 07)',
    hint: 'رقم الهاتف (مثل: 0791234567)',
  },
  images: {
    text: '📸 **أرسل صور السيارة** (اختياري)\n\nارسل الصور في الرسالة التالية، أو اكتب "تخطي" للاستمرار بدون صور.\n\n💡 يمكنك إرسال صورة واحدة أو أكثر.',
    hint: 'صور السيارة (base64) أو "تخطي"',
  },
  done: {
    text: '',
  },
};

const CAR_FLOW_STEPS: CarFlowStep[] = [
  'brand', 'model', 'year_km', 'fuel_trans', 'color_drivetrain',
  'condition_price', 'city_desc', 'phone', 'images', 'done',
];

function getCarFlowNextStep(current: CarFlowStep): CarFlowStep | null {
  const idx = CAR_FLOW_STEPS.indexOf(current);
  return idx >= 0 && idx < CAR_FLOW_STEPS.length - 1 ? CAR_FLOW_STEPS[idx + 1] : null;
}

function buildCarFlowSummary(data: Record<string, string>): string {
  const fuelMap: Record<string, string> = { '1': 'بنزين ⛽', '2': 'ديزل 🛢️', '3': 'هايبرد 🔋', '4': 'كهربائية ⚡', '5': 'PHEV' };
  const condMap: Record<string, string> = { '1': 'ممتازة ✨', '2': 'جيدة جداً 👍', '3': 'جيدة 👌', '4': 'مقبولة 🤏', '5': 'تحتاج صيانة 🔧', '6': 'تحتاج فحص ⚠️' };

  return `📋 **ملخص الإعلان:**\n\n` +
    `🚗 الماركة: ${data.brand || ''}\n` +
    `📦 الموديل: ${data.model || ''}\n` +
    `📅 السنة: ${data.year || ''}\n` +
    `🛣️ الممشى: ${data.kilometers || ''} كم\n` +
    `⛽ الوقود: ${fuelMap[data.fuelType] || data.fuelType || ''}\n` +
    `🔄 الناقل: ${data.transmission || ''}\n` +
    `🎨 اللون: ${data.color || ''}\n` +
    `🏗️ الدفع: ${data.drivetrain || ''}\n` +
    `⭐ الحالة: ${condMap[data.condition] || data.condition || ''}\n` +
    `💰 السعر: ${data.price || ''} د.أ\n` +
    `🏙️ المحافظة: ${data.city || ''}\n` +
    `📝 الوصف: ${data.description || ''}\n` +
    `📞 الهاتف: ${data.phone || ''}\n` +
    (data.whatsapp ? `💬 واتساب: ${data.whatsapp}\n` : '') +
    `\n💡 **اكتب "تأكيد" لإنشاء الإعلان، أو "إلغاء" للإلغاء.**`;
}

// ── Intent Detection ──
type Intent = 'car_search' | 'workshop' | 'parts' | 'price_analysis' | 'engine_sound' | 'car_listing' | 'selling' | 'workshop_add' | 'negotiation' | 'ticket' | 'site_info' | 'ref_code' | 'navigation' | 'general';

function detectIntent(query: string): Intent {
  // Normalize Arabic: أ/إ/آ → ا, ة → ه, ى → ي, then lowercase
  const q = query
    .replace(/[أإآءٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();
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

  // Direct URL match (user typed a path)
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
        // Longer keyword matches = higher score (more specific)
        score += kw.length;
      }
    }
    // Also check labelAr directly
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
      createdAt: true,
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
function buildCarReport(car: any, similarCars: any[], marketListings: any[], marketStats?: { avg: number; min: number; max: number; count: number } | null): string {
  const conditionMap: Record<string, string> = {
    EXCELLENT: 'ممتازة ✨', VERY_GOOD: 'جيدة جداً 👍', GOOD: 'جيدة 👌', FAIR: 'مقبولة 🤏',
  };
  const fuelMap: Record<string, string> = {
    PETROL: 'بنزين ⛽', DIESEL: 'ديزل 🛢️', HYBRID: 'هايبرد 🔋', ELECTRIC: 'كهربائية ⚡',
  };
  const transMap: Record<string, string> = {
    AUTOMATIC: 'أوتوماتيك 🔄', MANUAL: 'يدوي ✋',
  };

  // ── Listing age analysis ──
  const createdAt = car.createdAt ? new Date(car.createdAt) : null;
  const listingAge = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : null;
  let listingAgeAnalysis = '';
  let negotiationLeverage = '';
  if (listingAge !== null) {
    if (listingAge > 60) {
      listingAgeAnalysis = 'الإعلان قديم جداً — البائع يائس من البيع ويقبل أي عرض';
      negotiationLeverage = '💰 **نقطة تفاوض قوية:** الإعلان منشور من **' + listingAge + ' يوم** — البائع ينتظر طول الوقت، يعني ممكن ينزل السعر بشكل كبير';
    } else if (listingAge > 30) {
      listingAgeAnalysis = 'الإعلان قديم — السيارة ما انبععت من فترة، البائع ممكن يقبل تفاوض';
      negotiationLeverage = '💰 **نقطة تفاوض:** الإعلان عمره **' + listingAge + ' يوم** — لو السيارة كانت مناسبة للسوق، كان انبععت من زمان';
    } else if (listingAge > 14) {
      listingAgeAnalysis = 'الإعلان موجود منذ أسبوعين — لا توجد استعجال';
      negotiationLeverage = '💡 الإعلان عمره **' + listingAge + ' يوم** — يمكن تبدأ تفاوض بسيط';
    } else {
      listingAgeAnalysis = 'الإعلان جديد — البائع ينتظر عروض';
      negotiationLeverage = '⚠️ الإعلان جديد (**' + listingAge + ' يوم**) — البائع ما بحتاج يبيع بسرعة';
    }
  }

  // ── Price analysis (use market stats if available, fallback to local calculation) ──
  const sameModelListings = marketListings.filter(l =>
    l.title?.toLowerCase().includes(car.model?.nameEn?.toLowerCase() || '')
  );
  const marketPrices = sameModelListings.filter(l => l.price > 0).map(l => l.price);
  const sitePrices = similarCars.filter(s => s.price > 0).map(s => s.price);
  const allPrices = [...marketPrices, ...sitePrices, car.price].filter(p => p > 0);
  
  // Use market stats from OpenSooq if available, otherwise compute locally
  const avgPrice = marketStats?.avg || (allPrices.length > 0 ? Math.round(allPrices.reduce((a: number, b: number) => a + b, 0) / allPrices.length) : 0);
  const minPrice = marketStats?.min || (allPrices.length > 0 ? Math.min(...allPrices) : 0);
  const maxPrice = marketStats?.max || (allPrices.length > 0 ? Math.max(...allPrices) : 0);
  const listingCount = marketStats?.count || allPrices.length;

  let priceVerdict = '';
  let priceVerdictEmoji = '';
  let priceDiffPercent = 0;
  if (avgPrice > 0) {
    priceDiffPercent = Math.round(((car.price - avgPrice) / avgPrice) * 100);
    if (priceDiffPercent < -15) { priceVerdict = 'ممتاز — أقل بكثير من السوق'; priceVerdictEmoji = '🟢🟢'; }
    else if (priceDiffPercent < -10) { priceVerdict = 'منخفض — المتوسط'; priceVerdictEmoji = '🟢'; }
    else if (priceDiffPercent > 15) { priceVerdict = 'مرتفع جداً — يُنصح بالتفاوض أو التخلي'; priceVerdictEmoji = '🔴🔴'; }
    else if (priceDiffPercent > 10) { priceVerdict = 'مرتفع — يُنصح بالتفاوض'; priceVerdictEmoji = '🔴'; }
    else { priceVerdict = 'عادل — مناسب للسوق'; priceVerdictEmoji = '🟡'; }
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

  // ── Build the report ──
  let report = `🚗 **تقرير سيارة كامل: ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}**
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

${listingAge !== null ? `📅 **تحليل الإعلان:**
- عمر الإعلان: **${listingAge} يوم**
- التحليل: ${listingAgeAnalysis}
${negotiationLeverage}` : ''}

📊 **تحليل السعر بالبيانات الحقيقية:**
${avgPrice > 0 ? `- متوسط السوق: **${avgPrice.toLocaleString()} د.أ**
- أدنى سعر بالسوق: ${minPrice.toLocaleString()} د.أ
- أعلى سعر بالسوق: ${maxPrice.toLocaleString()} د.أ
- عدد الإعلانات المشابهة: **${listingCount}** إعلان
- تقييم السعر: **${priceVerdictEmoji} ${priceVerdict}**
- الفرق عن المتوسط: **${priceDiffPercent > 0 ? '+' : ''}${priceDiffPercent}%**
${marketStats ? `- مصدر البيانات: السوق المفتوح (OpenSooq) + الموقع` : '- مصدر البيانات: الموقع فقط (بيانات محدودة)'}` : '- لا توجد بيانات كافية لتحليل السعر'}

${similarCars.length > 0 ? `\n🔄 **سيارات مشابهة في الموقع:**\n${similarCars.map((s, i) => `${i + 1}. ${s.brand?.nameAr || ''} ${s.model?.nameAr || ''} ${s.year} — ${s.price?.toLocaleString() || 'غير محدد'} د.أ | ${s.city?.nameAr || ''}`).join('\n')}` : ''}

💡 **نصيحة:** انسخ الرمز المرجعي **${car.refCode || 'N/A'}** واحتفظ به للرجوع السريع.`;

  return report;
}

// ── Generate Suggestions ──
function generateSuggestions(intent: Intent, hasCars: boolean, hasWorkshops: boolean, hasParts: boolean): string[] {
  const suggestions: string[] = [];
  if (intent === 'ref_code') return ['مقارنة السعر بالسوق', 'البحث عن ورشة فحص', 'نصائح التفاوض', 'قطع غيار للسيارة'];
  if (intent === 'site_info') return ['كيف أضيف إعلان سيارة؟', 'كيف أضيف ورشة؟', 'تقييم سعر سيارة', 'دليل المنتدى'];
  if (intent === 'car_search' && hasCars) { suggestions.push('مقارنة الأسعار'); suggestions.push('تقييم حالة السيارة'); suggestions.push('نصائح التفاوض'); }
  if (intent === 'workshop' || hasWorkshops) { suggestions.push('حجز موعد'); suggestions.push('تقييمات الورش'); }
  if (intent === 'parts' || hasParts) { suggestions.push('قطع غيار أخرى'); suggestions.push('ورشة لتركيبها'); }
  if (intent === 'price_analysis') { suggestions.push('مقارنة مع سيارات مشابهة'); suggestions.push('تقييم الحالة'); suggestions.push('نصائح التفاوض'); }
  if (intent === 'engine_sound') { suggestions.push('تحليل صوت المحرك'); suggestions.push('ورشة صيانة'); }
  if (intent === 'selling') { suggestions.push('كيفية التسعير'); suggestions.push('نصائح للبيع'); suggestions.push('أضف إعلان مجاني'); }
  if (intent === 'workshop_add') { suggestions.push('خطوات إضافة الورشة'); suggestions.push('المستندات المطلوبة'); }
  if (intent === 'negotiation') { suggestions.push('تحليل سعر السيارة'); suggestions.push('نقاط الضعف في السيارة'); suggestions.push('مقارنة الأسعار'); }
  if (intent === 'ticket') { suggestions.push('إنشاء تذكرة دعم'); suggestions.push('مشكلة تقنية'); suggestions.push('شكوى عن إعلان'); }
  if (intent === 'car_search' && !hasCars) { suggestions.push('تغيير المعايير'); suggestions.push('بحث عن سيارة أخرى'); }
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
  userName?: string,
  userRole?: string,
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
${userName ? `- اسم المستخدم: ${userName}` : '- المستخدم غير مسجل الدخول'}
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
8. **أظهر نسبة الثقة** — عند تقديم تحليل أسعار، أظهر نسبة الثقة في البيانات.
9. **الرمز المرجعي** — إذا ذكر المستخدم رمزاً مثل S44-XBY، ابحث في البيانات وأعطِ تقريراً كاملاً يشمل: المواصفات + تحليل السعر + عمر الإعلان + نقاط التفاوض.
10. **شرح الموقع** — إذا سأل المستخدم عن أي ميزة أو صفحة، أجب بشكل شامل مع روابط مباشرة.
11. **أمثلة عملية** — عند شرح أي ميزة، أعطِ مثالاً عملياً كيف يستخدمها.
12. **البحث باللغة الطبيعية** — إذا فهمت البحث من كلام المستخدم الطبيعي، استخدم النتائج المفلترة واعرضها بوضوح.
13. **البحث في السوق المفتوح** — **أنت تقدر تبحث في السوق المفتوح** — البيانات تأتي تلقائياً. لا تقل "لا أستطيع البحث" أو "لا أملك إمكانية البحث الخارجي". إذا لم تتوفر البيانات بسبب التكنولوجيا، قل: "بيانات السوق المفتوح غير متوفرة حالياً".
16. **تستطيع البحث مواقع اردنية واعلانات لسيارات في الفيس بوك او اي موقع يعرض سيارات من اجل ان يكون لديك اعلان كثيرة من سيارات وتقدر تفيد المستخدم قدر الامكان ابحث قارن عبر الانترنت بين السيارات من اجل ان تكون  لديك معلومات وسيارات كثيرة ليحصل المستخدم اكبر قدر ممكن من الاسفادة**
17. **إذا ما لقيت سيارة نفس موديل ونوع سياة يلي طلبها مستخدم لكن ما قدرت توجد بنفس عدد كيلومترات ومواصفات عامة لسيارة تقدر تعطي مستخدم متوسط سعر سيارة العام في السوق بغضي النظر عن كم ماشيه كيلوميترات والمواصفات العامة الاخرى**
14. **اسم المستخدم — مطلوب في كل رد** — **إلزامي**: إذا كان اسم المستخدم معروضاً في معلومات المستخدم، **يجب** استخدام اسمه في كل رد. مثال: "أهلاً [الاسم]!" أو "حسناً [الاسم]، إليك الإجابة...". لا تكرر الاسم أكثر من مرة واحدة في كل رد.
15. **تحية المدير — خاصة ومحترمة** — إذا كان دور المستخدم ADMIN: ابدأ الرد بـ "أهلاً وسهلاً بلمدير الموقع [الاسم]!" أو "مرحباً بك يا مدير". تعامل مع المدير باحترام وراحة أكبر وقدم معلومات إضافية.`;
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

    const { messages, sessionId, model: requestedModel, userName, userRole, images, token: clientToken, carFlowStep: clientStep, carFlowData: clientData } = await request.json();
    const modelId: AIModelId = (requestedModel && ['glm', 'minimax', 'mistral', 'gpt-oss'].includes(requestedModel))
      ? requestedModel : DEFAULT_MODEL;
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

    // ── CAR LISTING FLOW: check if user is in an active flow ──
    // Priority: in-memory store (for same-request-instance) → client-provided state (stateless fallback)
    let activeCarFlow = carFlowStore.get(sid);
    if (!activeCarFlow && clientStep && clientData && clientStep !== 'done') {
      // Reconstruct flow from client-provided state (stateless mode)
      activeCarFlow = { step: clientStep, data: clientData, images: [], startedAt: Date.now() };
    }
    if (activeCarFlow && activeCarFlow.step !== 'done') {
      const answer = query.trim();
      const step = activeCarFlow.step;

      // Allow cancel at any step
      if (/^(إلغاء|الغاء|cancel|وقف|stop)$/i.test(answer)) {
        carFlowStore.delete(sid);
        const cancelMsg = '❌ تم إلغاء إنشاء الإعلان. يمكنك البدء مرة أخرى في أي وقت.';
        conversation.push({ role: 'assistant', content: cancelMsg });
        conversationStore.set(sid, conversation);
        return Response.json({
          success: true,
          data: { message: cancelMsg, cars: [], intent: 'car_listing', suggestions: ['إنشاء إعلان جديد', 'البحث عن سيارة'], sessionId: sid },
        });
      }

      // Handle each step
      if (step === 'brand') {
        activeCarFlow.data.brand = answer;
        const next = getCarFlowNextStep(step);
        if (next) { activeCarFlow.step = next; }
      } else if (step === 'model') {
        activeCarFlow.data.model = answer;
        const next = getCarFlowNextStep(step);
        if (next) { activeCarFlow.step = next; }
      } else if (step === 'year_km') {
        // User may provide year only, or year + km in one message
        const yearMatch = answer.match(/(20\d{2}|19\d{2})/);
        // km match requires suffix (كم/كيلومتر/km) OR a number > 9999 that's NOT the year
        const kmWithSuffix = answer.match(/(\d[\d,]*)\s*(?:كم|كيلومتر|km)/i);
        const kmAlone = answer.match(/(\d[\d,]+)/);
        const kmVal = kmAlone ? parseInt(kmAlone[1].replace(/,/g, '')) : 0;
        const yearVal = yearMatch ? parseInt(yearMatch[1]) : 0;
        const kmMatch = kmWithSuffix || (kmAlone && kmVal > 999 && kmVal !== yearVal ? kmAlone : null);
        if (yearMatch) activeCarFlow.data.year = yearMatch[1];
        if (kmMatch) activeCarFlow.data.kilometers = kmMatch[1].replace(/,/g, '');
        // If only year given (no km), ask for km next
        if (!kmMatch && yearMatch) {
          // Stay on same step but update the question
          const encoder = new TextEncoder();
          const kmMsg = '🛣️ **كم ممشى السيارة بالكيلومتر؟**\n\n(مثل: 90000)';
          conversation.push({ role: 'assistant', content: kmMsg });
          conversationStore.set(sid, conversation);
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: [], intent: 'car_listing', carFlow: { step: 'year_km', collecting: 'kilometers', data: activeCarFlow.data } })}\n\n`));
              controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: kmMsg })}\n\n`));
              controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
              controller.close();
            },
          });
          return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
        }
        const next = getCarFlowNextStep(step);
        if (next) { activeCarFlow.step = next; }
      } else if (step === 'fuel_trans') {
        // User may provide fuel + transmission in one message
        const fuelMap: Record<string, string> = { '1': 'PETROL', '2': 'DIESEL', '3': 'HYBRID', '4': 'ELECTRIC', '5': 'PLUGIN_HYBRID' };
        const transMap: Record<string, string> = { '1': 'MANUAL', '2': 'AUTOMATIC', '3': 'CVT', '4': 'DCT', '5': 'SEMI_AUTOMATIC' };
        const fuelMatch = answer.match(/[1-5]/);
        if (fuelMatch) activeCarFlow.data.fuelType = fuelMap[fuelMatch[1]] || 'PETROL';
        // Check for transmission
        const transMatch = answer.match(/(?:أوتوماتيك|اتوماتيك|automatic|2)/i);
        const manualMatch = answer.match(/(?:يدوي|manual|1)/i);
        if (transMatch) activeCarFlow.data.transmission = 'AUTOMATIC';
        else if (manualMatch) activeCarFlow.data.transmission = 'MANUAL';
        // If only fuel given, ask for transmission next
        if (!transMatch && !manualMatch && fuelMatch) {
          const encoder = new TextEncoder();
          const transMsg = '🔄 **ما نوع الناقل (الجير)؟**\n\n1️⃣ يدوي\n2️⃣ أوتوماتيك\n3️⃣ CVT\n4️⃣ DCT\n5️⃣ نصف أوتوماتيك';
          conversation.push({ role: 'assistant', content: transMsg });
          conversationStore.set(sid, conversation);
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: [], intent: 'car_listing', carFlow: { step: 'fuel_trans', collecting: 'transmission', data: activeCarFlow.data } })}\n\n`));
              controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: transMsg })}\n\n`));
              controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
              controller.close();
            },
          });
          return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
        }
        const next = getCarFlowNextStep(step);
        if (next) { activeCarFlow.step = next; }
      } else if (step === 'color_drivetrain') {
        activeCarFlow.data.color = answer;
        // Try to detect drivetrain
        const driveMatch = answer.match(/(4wd|awd|fwd|rwd|دفع\s+رباعي|امامي|خلفي)/i);
        if (driveMatch) {
          const d = driveMatch[1].toLowerCase();
          if (d.includes('4wd') || d.includes('رباعي')) activeCarFlow.data.drivetrain = 'FOUR_WD';
          else if (d.includes('awd')) activeCarFlow.data.drivetrain = 'AWD';
          else if (d.includes('fwd') || d.includes('امامي')) activeCarFlow.data.drivetrain = 'FWD';
          else if (d.includes('rwd') || d.includes('خلفي')) activeCarFlow.data.drivetrain = 'RWD';
        } else {
          activeCarFlow.data.drivetrain = 'FWD'; // default
        }
        const next = getCarFlowNextStep(step);
        if (next) { activeCarFlow.step = next; }
      } else if (step === 'condition_price') {
        const condMap: Record<string, string> = { '1': 'EXCELLENT', '2': 'VERY_GOOD', '3': 'GOOD', '4': 'FAIR', '5': 'NEEDS_MAINTENANCE', '6': 'NEEDS_INSPECTION' };
        const condMatch = answer.match(/[1-6]/);
        if (condMatch) activeCarFlow.data.condition = condMap[condMatch[1]] || 'GOOD';
        // Also check for price in same message
        const priceMatch = answer.match(/(\d[\d,]*)\s*(?:دينار|د\.أ)?/);
        if (priceMatch && parseInt(priceMatch[1].replace(/,/g, '')) > 100) {
          activeCarFlow.data.price = priceMatch[1].replace(/,/g, '');
        }
        if (!priceMatch || parseInt(priceMatch[1].replace(/,/g, '')) <= 100) {
          // Ask for price
          const encoder = new TextEncoder();
          const priceMsg = '💰 **كم سعر البيع بالدينار الأردني؟**\n\n(مثل: 15000)';
          conversation.push({ role: 'assistant', content: priceMsg });
          conversationStore.set(sid, conversation);
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: [], intent: 'car_listing', carFlow: { step: 'condition_price', collecting: 'price', data: activeCarFlow.data } })}\n\n`));
              controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: priceMsg })}\n\n`));
              controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
              controller.close();
            },
          });
          return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
        }
        const next = getCarFlowNextStep(step);
        if (next) { activeCarFlow.step = next; }
      } else if (step === 'city_desc') {
        activeCarFlow.data.city = answer;
        // Auto-generate a description if user provided short answer
        if (answer.length < 30) {
          activeCarFlow.data.description = `${activeCarFlow.data.brand} ${activeCarFlow.data.model} ${activeCarFlow.data.year} — حالة ${activeCarFlow.data.condition || 'جيدة'} — ممشى ${activeCarFlow.data.kilometers || 'غير محدد'} كم`;
        } else {
          activeCarFlow.data.description = answer;
        }
        const next = getCarFlowNextStep(step);
        if (next) { activeCarFlow.step = next; }
      } else if (step === 'phone') {
        activeCarFlow.data.phone = answer.replace(/[^0-9]/g, '');
        const next = getCarFlowNextStep(step);
        if (next) { activeCarFlow.step = next; }
      } else if (step === 'images') {
        // Accept images from the request body (base64 data URIs)
        if (images && Array.isArray(images) && images.length > 0) {
          activeCarFlow.images = images;
        } else {
          // Check if user wants to skip
          if (/^(تخطي|skip|بدون|no|لا|مافي)$/i.test(answer)) {
            activeCarFlow.images = [];
          }
        }
        const next = getCarFlowNextStep(step);
        if (next) { activeCarFlow.step = next; }
      }

      // If flow is now done, show summary
      if (activeCarFlow.step === 'done') {
        const summary = buildCarFlowSummary(activeCarFlow.data);
        conversation.push({ role: 'assistant', content: summary });
        conversationStore.set(sid, conversation);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: ['تأكيد الإنشاء', 'إلغاء'], intent: 'car_listing', carFlow: { step: 'done', data: activeCarFlow.data, images: activeCarFlow.images } })}\n\n`));
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: summary })}\n\n`));
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            controller.close();
          },
        });
        return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
      }

      // Send next question
      const nextQuestion = CAR_FLOW_QUESTIONS[activeCarFlow.step];
      if (nextQuestion) {
        carFlowStore.set(sid, activeCarFlow);
        conversation.push({ role: 'assistant', content: nextQuestion.text });
        conversationStore.set(sid, conversation);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: [], intent: 'car_listing', carFlow: { step: activeCarFlow.step, hint: nextQuestion.hint, data: activeCarFlow.data } })}\n\n`));
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: nextQuestion.text })}\n\n`));
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            controller.close();
          },
        });
        return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
      }
    }

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

      // Compute market stats for the report
      const sameModelListings = marketListings.filter((l: any) =>
        l.title?.toLowerCase().includes(car.model?.nameEn?.toLowerCase() || '')
      );
      const marketPrices = sameModelListings.filter((l: any) => l.price > 0).map((l: any) => l.price);
      const sitePrices = similarCars.filter((s: any) => s.price > 0).map((s: any) => s.price);
      const allPrices = [...marketPrices, ...sitePrices, car.price].filter((p: number) => p > 0);
      const marketStats = allPrices.length >= 2 ? {
        avg: Math.round(allPrices.reduce((a: number, b: number) => a + b, 0) / allPrices.length),
        min: Math.min(...allPrices),
        max: Math.max(...allPrices),
        count: allPrices.length,
      } : null;

      const report = buildCarReport(car, similarCars, marketListings, marketStats);
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

    // ── NAVIGATION: fast path ──
    if (intent === 'navigation') {
      const targetPage = detectTargetPage(normalizedQuery);
      if (targetPage) {
        if (targetPage.requiresAuth && !userName) {
          const authMsg = `🔒 هذه الصفحة "${targetPage.labelAr}" تتطلب تسجيل دخول.\n\nسأنقلك الآن لصفحة تسجيل الدخول...`;
          conversation.push({ role: 'assistant', content: authMsg });
          conversationStore.set(sid, conversation);
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: ['إنشاء حساب جديد', 'العودة للرئيسية'], intent: 'navigation', navigate: { url: '/auth/login', label: 'تسجيل الدخول' } })}\n\n`));
              controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: authMsg })}\n\n`));
              controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
              controller.close();
            },
          });
          return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
        }

        if (targetPage.requiresAdmin && userRole !== 'ADMIN') {
          const adminMsg = `⛔ صفحة "${targetPage.labelAr}" متاحة فقط لمدير الموقع.`;
          conversation.push({ role: 'assistant', content: adminMsg });
          conversationStore.set(sid, conversation);
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: ['العودة للرئيسية'], intent: 'navigation' })}\n\n`));
              controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: adminMsg })}\n\n`));
              controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
              controller.close();
            },
          });
          return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
        }

        const successMsg = `✅ سأنقلك الآن إلى صفحة "${targetPage.labelAr}"...`;
        conversation.push({ role: 'assistant', content: successMsg });
        conversationStore.set(sid, conversation);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: ['العودة للرئيسية', 'المساعد الذكي'], intent: 'navigation', navigate: { url: targetPage.url, label: targetPage.labelAr } })}\n\n`));
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: successMsg })}\n\n`));
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            controller.close();
          },
        });
        return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
      }

      const fallbackNavMsg = `🤔 أي صفحة تريد أن أخذك إليها؟\n\nأمثلة:\n- المفضلة\n- إعلاناتي\n- الجراج\n- ورش العمل\n- قطع الغيار\n- المنتدى\n- الملف الشخصي\n\nاكتب اسم الصفحة وسأنقلك لها مباشرة!`;
      conversation.push({ role: 'assistant', content: fallbackNavMsg });
      conversationStore.set(sid, conversation);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: ['المفضلة', 'إعلاناتي', 'الجراج', 'ورش العمل'], intent: 'navigation' })}\n\n`));
          controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: fallbackNavMsg })}\n\n`));
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          controller.close();
        },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
    }

    // ── CAR LISTING: start guided flow ──
    if (intent === 'car_listing') {
      // Check if user is logged in — accept userName OR clientToken
      const isLoggedIn = userName || clientToken;
      if (!isLoggedIn) {
        const authMsg = '🔒 لإنشاء إعلان سيارة، تحتاج تسجيل دخول أولاً.\n\nسأنقلك الآن لصفحة تسجيل الدخول...';
        conversation.push({ role: 'assistant', content: authMsg });
        conversationStore.set(sid, conversation);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: ['إنشاء حساب جديد', 'العودة للرئيسية'], intent: 'car_listing', navigate: { url: '/auth/login', label: 'تسجيل الدخول' } })}\n\n`));
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: authMsg })}\n\n`));
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            controller.close();
          },
        });
        return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
      }

      // Start the car listing flow
      const firstStep: CarFlowStep = 'brand';
      carFlowStore.set(sid, {
        step: firstStep,
        data: {},
        images: [],
        startedAt: Date.now(),
      });

      const firstQuestion = CAR_FLOW_QUESTIONS[firstStep];
      conversation.push({ role: 'assistant', content: firstQuestion.text });
      conversationStore.set(sid, conversation);

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ cars: [], suggestions: ['إلغاء'], intent: 'car_listing', carFlow: { step: firstStep, hint: firstQuestion.hint } })}\n\n`));
          controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: firstQuestion.text })}\n\n`));
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          controller.close();
        },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
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
      userName, userRole,
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
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch { /* controller already closed */ }
        };

        // Send metadata first
        sendSSE('meta', {
          intent,
          // Only send cars to frontend when user explicitly asks for car search
          cars: (intent === 'car_search' || intent === 'ref_code' || intent === 'price_analysis')
            ? cars.slice(0, 10).map((car: any) => ({
                id: car.id, slug: car.slug, refCode: car.refCode,
                title: `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`,
                price: car.price, year: car.year, kilometers: car.kilometers,
                fuelType: car.fuelType, transmission: car.transmission, condition: car.condition,
                image: car.images?.[0]?.url || null, city: car.city?.nameAr || '',
              }))
            : [],
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
          let lastChunkTime = Date.now();
          const STREAM_WATCHDOG_MS = 30000; // reset if no chunk for 30s

          for await (const chunk of chatCompletionStream(chatMessages, {
            temperature: 0.7,
            maxTokens: 2048,
            timeoutMs: 45000,
            modelId,
          })) {
            lastChunkTime = Date.now();
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
      cancel() {
        console.log('[AI Chat Stream] Client disconnected');
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
  } catch (err: any) {
    console.error('[AI Chat Stream] Fatal error:', err?.message, err?.stack);
    return Response.json({
      success: true,
      data: { message: 'عذراً، حدث خطأ. جرب تكتب سؤالك بطريقة ثانية.', cars: [], intent: 'general', suggestions: ['بحث عن سيارة', 'مساعد شراء'], _error: err?.message },
    });
  }
}
