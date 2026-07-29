/**
 * Price Analysis v5.0.0 — NVIDIA AI-powered price assessment for car detail pages.
 *
 * Architecture:
 *  1. PRIMARY: NVIDIA LLM analyzes price vs market value using DB + OpenSooq data.
 *  2. FALLBACK: Local heuristic (original logic) if LLM fails.
 *  3. External market data from OpenSooq for broader Jordanian market coverage.
 */
import OpenAI from 'openai';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'z-ai/glm-5.2';
import { chatCompletionJSON, type ChatMessage } from './nvidia-client';
import { getSystemPrompt } from './site-knowledge';
import { fetchOpenSooqListings, type OpenSooqListing } from '@/lib/opensooq-scrape';
import {
  JORDAN_PRICES, MODEL_ADJUSTMENTS, CONDITION_FACTORS,
  normalizeBrand as normalizeBrandShared, calculateBasePrice as calculateBasePriceShared,
} from './brand-prices';

export interface CarData {
  brand: string;
  model: string;
  year: number;
  trim?: string;
  kilometers: number;
  condition: string;
  fuelType: string;
  transmission: string;
  bodyType?: string;
  engineCapacity?: string;
  cylinders?: string;
  drivetrain?: string;
  color?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  isPaintOriginal?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isNegotiable?: boolean;
  price?: number;
  cityId?: string;
}

export interface PriceFactor {
  name: string;
  impact: number;
  description: string;
  icon: string;
}

export interface SimilarCar {
  id: string;
  title: string;
  price: number;
  year: number;
  kilometers: number;
  condition: string;
  city: string;
  image: string | null;
  similarity: number;
  source: string;
}

export interface PriceAnalysis {
  valuation: {
    fairPrice: number;
    minPrice: number;
    maxPrice: number;
    confidence: number;
    sources: string[];
  };
  assessment: {
    position: 'below' | 'within' | 'above';
    label: string;
    color: string;
    icon: string;
    diffPercent: number;
    diffAmount: number;
    explanation: string;
  };
  factors: PriceFactor[];
  similarCars: SimilarCar[];
  marketListings: SimilarCar[];
  summary: {
    headline: string;
    detail: string;
    recommendation: string;
  };
}

interface LLMAnalysisResult {
  fairPrice: number;
  confidence: number;
  position: 'below' | 'within' | 'above';
  explanation: string;
  recommendation: string;
  factors: PriceFactor[];
}

// ── LLM-based price analysis ──
async function analyzePriceWithLLM(
  car: CarData,
  similarCars: SimilarCar[],
  marketListings: SimilarCar[],
  dbAvg: number,
  marketAvg: number
): Promise<LLMAnalysisResult | null> {
  try {
    const systemPrompt = getSystemPrompt('analysis');

    const similarData = similarCars.length > 0
      ? similarCars.slice(0, 5).map(c => `  - ${c.title}: ${c.price.toLocaleString()} د.أ (${c.year}, ${c.kilometers.toLocaleString()} كم, ${c.condition}) — ${c.source}`).join('\n')
      : 'لا تتوفر إعلانات مشابهة من JO Cars.';

    const marketData = marketListings.length > 0
      ? marketListings.slice(0, 8).map(c => `  - ${c.title}: ${c.price.toLocaleString()} د.أ (${c.year}, ${c.kilometers.toLocaleString()} كم) — ${c.city || 'الأردن'} — ${c.source}`).join('\n')
      : 'لا تتوفر بيانات من السوق الخارجي.';

    const userMessage = `حلّل سعر هذه السيارة مقارنة بالسوق الأردني الكامل (JO Cars + السوق الخارجي):

السيارة المُقيّمة:
- الماركة: ${car.brand}
- الموديل: ${car.model}
- السنة: ${car.year}
- الكيلومترات: ${car.kilometers.toLocaleString()} كم
- الحالة: ${car.condition}
- نوع الوقود: ${car.fuelType}
- ناقل الحركة: ${car.transmission}
- سعة المحرك: ${car.engineCapacity || 'غير محدد'}
- نوع الهيكل: ${car.bodyType || 'غير محدد'}
- الدفع: ${car.drivetrain || 'غير محدد'}
- اللون: ${car.color || 'غير محدد'}
- عدد الملاك: ${car.ownerCount || 1}
- مصدومة: ${car.isDamaged ? 'نعم' : 'لا'}
- ضمان: ${car.hasWarranty ? 'نعم' : 'لا'}
- سجل صيانة: ${car.hasServiceHistory ? 'نعم' : 'لا'}
- السعر المعلن: ${car.price ? car.price.toLocaleString() + ' د.أ' : 'غير محدد'}
- القابل للتفاوض: ${car.isNegotiable ? 'نعم' : 'لا'}

إعلانات مشابهة من JO Cars (${similarCars.length} إعلان):
${similarData}
${dbAvg > 0 ? `متوسط أسعار JO Cars: ${dbAvg.toLocaleString()} د.أ` : ''}

إعلانات مشابهة من السوق الخارجي - أونصوك (${marketListings.length} إعلان):
${marketData}
${marketAvg > 0 ? `متوسط أسعار السوق الخارجي: ${marketAvg.toLocaleString()} د.أ` : ''}

المطلوب منك:
1. قارن السعر المعلن مع متوسط الأسعار من كلاالمصدرين
2. حدد السعر العادل بناءً على جميع البيانات
3. أعطِ نسبة ثقة في التحليل بناءً على جودة البيانات وكميتها
4. حدد إذا كان السعر أقل أو ضمن أو أعلى من السوق

أجب بالـ JSON فقط:
{
  "fairPrice": <رقم - السعر العادل بالدينار الأردني>,
  "confidence": <رقم 0-100 - نسبة الثقة بناءً على جودة البيانات>,
  "position": "<below/within/above> - مقارنة بالسعر المعلن",
  "explanation": "<تفسير عربي للنتيجة مع ذكر مصادر البيانات>",
  "recommendation": "<توصية عملية>",
  "factors": [
    { "name": "<اسم العامل>", "impact": <-0.5 إلى 0.5>, "description": "<وصف>", "icon": "<calendar/gauge/shield/fuel/settings/car/alert/check/clipboard/users/palette>" }
  ]
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const result = await chatCompletionJSON<LLMAnalysisResult>(messages, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    if (result && result.fairPrice > 0) {
      result.fairPrice = Math.max(1000, result.fairPrice);
      result.confidence = Math.max(40, Math.min(95, result.confidence || 75));
      result.position = result.position || 'within';
      result.factors = result.factors || [];
      return result;
    }
    return null;
  } catch (error) {
    console.error('[PriceAnalysis LLM] Error:', error);
    return null;
  }
}

// ── Local heuristic fallback ──
function analyzeFactors(car: CarData): PriceFactor[] {
  const factors: PriceFactor[] = [];
  const age = new Date().getFullYear() - car.year;
  let ageFactor = 0;
  if (age === 0) ageFactor = 0.05;
  else if (age <= 2) ageFactor = 0.03;
  else if (age >= 10) ageFactor = -0.05;
  factors.push({ name: 'سنة الصنع', impact: ageFactor, description: age === 0 ? 'سيارة جديدة' : `عمرها ${age} سنة`, icon: 'calendar' });

  const expectedKm = age * 20000;
  let kmFactor = 0;
  if (expectedKm > 0) {
    const kmRatio = car.kilometers / expectedKm;
    if (kmRatio > 1.5) kmFactor = -0.20;
    else if (kmRatio > 1.3) kmFactor = -0.12;
    else if (kmRatio < 0.5) kmFactor = 0.06;
  }
  factors.push({ name: 'عداد الكيلومترات', impact: kmFactor, description: `${car.kilometers.toLocaleString()} كم`, icon: 'gauge' });

  const condFactor = CONDITION_FACTORS[car.condition] || 0;
  factors.push({ name: 'حالة السيارة', impact: condFactor, description: car.condition, icon: 'shield' });

  if (car.isDamaged) factors.push({ name: 'مصدوم سابقاً', impact: -0.20, description: 'سيارة مصدومة سابقاً', icon: 'alert' });
  if (car.ownerCount && car.ownerCount > 1) factors.push({ name: 'عدد الملاك', impact: Math.max(-0.15, -(car.ownerCount - 1) * 0.03), description: `${car.ownerCount} ملاك`, icon: 'users' });
  if (car.hasWarranty) factors.push({ name: 'ضمان', impact: 0.03, description: 'تحت الضمان', icon: 'check' });
  if (car.hasServiceHistory) factors.push({ name: 'سجل صيانة', impact: 0.05, description: 'سجل صيانة كامل', icon: 'clipboard' });
  if (car.isPaintOriginal === false) factors.push({ name: 'الدهان غير أصلي', impact: -0.05, description: 'تم طلاؤها', icon: 'palette' });

  return factors;
}

function calculateSimilarityScore(car: CarData, candidate: { brand?: string; model?: string; year: number; kilometers: number }): number {
  let score = 0;
  if (candidate.brand && normalizeBrandShared(candidate.brand) === normalizeBrandShared(car.brand)) score += 25;
  if (candidate.model && car.model) {
    const candModel = candidate.model.toLowerCase();
    const carModel = car.model.toLowerCase();
    if (candModel === carModel) score += 25;
    else if (candModel.includes(carModel) || carModel.includes(candModel)) score += 15;
  }
  const yearDiff = Math.abs(candidate.year - car.year);
  if (yearDiff === 0) score += 20;
  else if (yearDiff === 1) score += 15;
  else if (yearDiff <= 2) score += 10;
  if (car.kilometers > 0 && candidate.kilometers > 0) {
    const kmDiff = Math.abs(candidate.kilometers - car.kilometers) / Math.max(car.kilometers, 1);
    if (kmDiff < 0.1) score += 15;
    else if (kmDiff < 0.2) score += 10;
    else if (kmDiff < 0.3) score += 5;
  }
  return Math.min(100, score);
}

async function getDbSimilarCars(car: CarData): Promise<SimilarCar[]> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const where: Record<string, unknown> = {
      status: 'APPROVED', price: { gt: 0 },
      year: { gte: car.year - 3, lte: car.year + 3 },
    };
    if (car.brand) {
      where.OR = [
        { brand: { nameAr: { contains: car.brand } } },
        { brand: { nameEn: { contains: car.brand } } },
      ];
    }
    const cars = await prisma.car.findMany({
      where, take: 30, orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, price: true, year: true, kilometers: true, condition: true, fuelType: true, transmission: true,
        brand: { select: { nameAr: true, nameEn: true } }, model: { select: { nameAr: true, nameEn: true } },
        city: { select: { nameAr: true } }, images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
      },
    });
    return cars.map(c => ({
      id: c.id, title: `${c.brand?.nameAr || ''} ${c.model?.nameAr || ''} ${c.year}`, price: c.price,
      year: c.year, kilometers: c.kilometers, condition: c.condition, city: c.city?.nameAr || '',
      image: c.images?.[0]?.url || null,
      similarity: calculateSimilarityScore(car, { brand: c.brand?.nameAr, model: c.model?.nameAr, year: c.year, kilometers: c.kilometers }),
      source: 'JO Cars',
    })).sort((a, b) => b.similarity - a.similarity).slice(0, 10);
  } catch { return []; }
}

function generateAssessment(userPrice: number, fairPrice: number, factors: PriceFactor[]): PriceAnalysis['assessment'] {
  if (!userPrice || userPrice === 0) {
    return { position: 'within', label: 'لم يتم تحديد السعر', color: 'text-gray-500', icon: 'info', diffPercent: 0, diffAmount: 0, explanation: 'يمكنك استخدام السعر العادل كنقطة بداية.' };
  }
  const diffPercent = fairPrice > 0 ? Math.round(((userPrice - fairPrice) / fairPrice) * 100) : 0;
  const diffAmount = userPrice - fairPrice;
  const topFactors = [...factors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 3);
  const factorExplanations = topFactors.map(f => `(${f.name})`).join(' ');

  if (diffPercent < -10) {
    return { position: 'below', label: 'أقل من القيمة السوقية', color: 'text-green-600', icon: 'trending-down', diffPercent, diffAmount,
      explanation: `سعرك أقل بـ ${Math.abs(diffPercent)}% من القيمة العادلة ${factorExplanations}. قد يكون جذاباً للمشترين.` };
  }
  if (diffPercent <= 10) {
    return { position: 'within', label: 'ضمن السعر العادل', color: 'text-blue-600', icon: 'check-circle', diffPercent, diffAmount,
      explanation: `سعرك في نطاق السعر العادل ${factorExplanations}. سعر مناسب للسوق.` };
  }
  return { position: 'above', label: 'أعلى من القيمة السوقية', color: 'text-red-600', icon: 'trending-up', diffPercent, diffAmount,
    explanation: `سعرك أعلى بـ ${diffPercent}% من القيمة العادلة ${factorExplanations}. قد يصعب البيع بهذا السعر.` };
}

export async function analyzeCarPrice(car: CarData): Promise<PriceAnalysis> {
  const basePrice = calculateBasePriceShared(car.brand, car.model, car.year);
  const factors = analyzeFactors(car);

  let totalImpact = 0;
  for (const factor of factors) totalImpact += factor.impact;
  totalImpact = Math.max(-0.50, Math.min(0.50, totalImpact));
  let fairPrice = Math.round(basePrice * (1 + totalImpact));
  let minPrice = Math.round(fairPrice * 0.85);
  let maxPrice = Math.round(fairPrice * 1.15);

  // Fetch DB similar cars + OpenSooq market listings in parallel
  const [similarCars, openSooqResult] = await Promise.all([
    getDbSimilarCars(car),
    fetchOpenSooqListings(car.brand, car.model, car.year).catch(() => null),
  ]);

  const dbPrices = similarCars.map(c => c.price).filter(p => p > 0);
  const dbAvg = dbPrices.length > 0 ? Math.round(dbPrices.reduce((a, b) => a + b, 0) / dbPrices.length) : 0;

  // Convert OpenSooq listings to SimilarCar format
  const osListings: OpenSooqListing[] = openSooqResult?.listings || [];
  const osStats = openSooqResult?.stats || null;
  const marketListings: SimilarCar[] = osListings.slice(0, 10).map(l => ({
    id: l.url,
    title: l.title,
    price: l.price,
    year: l.year || car.year,
    kilometers: l.km || 0,
    condition: 'غير محدد',
    city: l.city || 'الأردن',
    image: null,
    similarity: calculateSimilarityScore(car, { brand: car.brand, model: car.model, year: l.year || car.year, kilometers: l.km || 0 }),
    source: l.site || 'السوق الخارجي',
  }));

  const marketPrices = marketListings.map(c => c.price).filter(p => p > 0);
  const marketAvg = osStats ? osStats.avg : (marketPrices.length > 0 ? Math.round(marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length) : 0);

  let confidence = 60;
  const sources: string[] = ['تحليل ذكي'];

  // Try LLM analysis with both DB + OpenSooq data
  const llmResult = await analyzePriceWithLLM(car, similarCars, marketListings, dbAvg, marketAvg);

  if (llmResult) {
    fairPrice = llmResult.fairPrice;
    minPrice = Math.round(fairPrice * 0.85);
    maxPrice = Math.round(fairPrice * 1.15);
    confidence = llmResult.confidence;
    sources.length = 0;
    sources.push('ذكاء اصطناعي (NVIDIA AI)');

    // Blend with DB data
    if (dbPrices.length >= 3 && marketPrices.length >= 3) {
      // Best case: both sources available
      fairPrice = Math.round(fairPrice * 0.5 + dbAvg * 0.25 + marketAvg * 0.25);
      confidence = Math.min(95, confidence + 10);
      sources.push(`JO Cars (${dbPrices.length} إعلان مشابه)`);
      sources.push(`السوق الخارجي (${marketPrices.length} إعلان)`);
    } else if (dbPrices.length >= 3) {
      fairPrice = Math.round(fairPrice * 0.65 + dbAvg * 0.35);
      confidence = Math.min(95, confidence + 5);
      sources.push(`JO Cars (${dbPrices.length} إعلان مشابه)`);
    } else if (marketPrices.length >= 3) {
      fairPrice = Math.round(fairPrice * 0.65 + marketAvg * 0.35);
      confidence = Math.min(95, confidence + 5);
      sources.push(`السوق الخارجي (${marketPrices.length} إعلان)`);
    }
  } else {
    // Fallback to local heuristic
    if (dbPrices.length >= 3 && marketPrices.length >= 3) {
      fairPrice = Math.round(fairPrice * 0.25 + dbAvg * 0.35 + marketAvg * 0.40);
      confidence = 88;
      sources.push(`JO Cars (${dbPrices.length} إعلان)`);
      sources.push(`السوق الخارجي (${marketPrices.length} إعلان)`);
    } else if (dbPrices.length >= 3) {
      fairPrice = Math.round(fairPrice * 0.45 + dbAvg * 0.55);
      confidence = 82;
      sources.push(`JO Cars (${dbPrices.length} إعلان مشابه)`);
    } else if (marketPrices.length >= 3) {
      fairPrice = Math.round(fairPrice * 0.45 + marketAvg * 0.55);
      confidence = 80;
      sources.push(`السوق الخارجي (${marketPrices.length} إعلان)`);
    } else if (dbPrices.length >= 1) {
      fairPrice = Math.round(fairPrice * 0.65 + dbAvg * 0.35);
      confidence = 72;
      sources.push(`JO Cars (${dbPrices.length} إعلان)`);
    }
  }

  const assessment = generateAssessment(car.price || 0, fairPrice, llmResult?.factors || factors);
  const carName = `${car.brand} ${car.model} ${car.year}`;
  const headline = assessment.position === 'below' ? `${carName} — سعر أقل من السوق` : assessment.position === 'within' ? `${carName} — سعر عادل` : `${carName} — سعر أعلى من السوق`;
  const detail = `بناءً على تحليل ${similarCars.length} إعلان من JO Cars + ${marketListings.length} إعلان من السوق الخارجي، السعر العادل المقدر هو ${fairPrice.toLocaleString()} د.أ. ${assessment.explanation}`;
  const recommendation = assessment.position === 'below' ? `يمكنك رفع السعر إلى ${fairPrice.toLocaleString()} د.أ` : assessment.position === 'within' ? 'سعرك مناسب ويمكنك المتابعة.' : `يُنصح بخفض السعر إلى ${fairPrice.toLocaleString()} د.أ`;

  return {
    valuation: { fairPrice, minPrice, maxPrice, confidence: Math.min(95, confidence), sources },
    assessment,
    factors: llmResult?.factors || factors,
    similarCars,
    marketListings,
    summary: { headline, detail, recommendation },
  };
}
