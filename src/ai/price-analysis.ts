/**
 * Price Analysis v4.0.0 — NVIDIA AI-powered price assessment for car detail pages.
 *
 * Architecture:
 *  1. PRIMARY: NVIDIA LLM analyzes price vs market value.
 *  2. FALLBACK: Local heuristic (original logic) if LLM fails.
 */

import { chatCompletionJSON, type ChatMessage } from './nvidia-client';
import { getSystemPrompt } from './site-knowledge';

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
  dbAvg: number
): Promise<LLMAnalysisResult | null> {
  try {
    const systemPrompt = getSystemPrompt('analysis');

    const similarData = similarCars.length > 0
      ? similarCars.slice(0, 5).map(c => `  - ${c.title}: ${c.price.toLocaleString()} د.أ (${c.year}, ${c.kilometers.toLocaleString()} كم, ${c.condition}) — ${c.source}`).join('\n')
      : 'لا تتوفر إعلانات مشابهة.';

    const userMessage = `حلّل سعر هذه السيارة مقارنة بالسوق الأردني:

السيارة:
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

الإعلانات المشابهة:
${similarData}
${dbAvg > 0 ? `متوسط أسعار المشابه: ${dbAvg.toLocaleString()} د.أ` : ''}

أجب بالـ JSON فقط:
{
  "fairPrice": <رقم - السعر العادل بالدينار الأردني>,
  "confidence": <رقم 0-100>,
  "position": "<below/within/above> - مقارنة بالسعر المعلن",
  "explanation": "<تفسير عربي للنتيجة>",
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
const JORDAN_PRICES: Record<string, Record<number, number>> = {
  toyota: { 2026: 24000, 2025: 22000, 2024: 20000, 2023: 18000, 2022: 16500, 2021: 15000, 2020: 13500, 2019: 12000, 2018: 10500, 2017: 9500, 2016: 8500, 2015: 7500, 2014: 6500, 2013: 5500 },
  honda: { 2026: 22000, 2025: 20000, 2024: 18000, 2023: 16000, 2022: 14500, 2021: 13000, 2020: 11500, 2019: 10000, 2018: 9000, 2017: 8000, 2016: 7000, 2015: 6000, 2014: 5500, 2013: 5000 },
  hyundai: { 2026: 20000, 2025: 18000, 2024: 16000, 2023: 14000, 2022: 12500, 2021: 11000, 2020: 9500, 2019: 8500, 2018: 7500, 2017: 6500, 2016: 5500, 2015: 5000, 2014: 4500, 2013: 4000 },
  nissan: { 2026: 21000, 2025: 19000, 2024: 17000, 2023: 15000, 2022: 13500, 2021: 12000, 2020: 10500, 2019: 9000, 2018: 8000, 2017: 7000, 2016: 6000, 2015: 5500, 2014: 5000, 2013: 4500 },
  kia: { 2026: 19000, 2025: 17000, 2024: 15000, 2023: 13000, 2022: 11500, 2021: 10000, 2020: 8500, 2019: 7500, 2018: 6500, 2017: 5500, 2016: 5000, 2015: 4500, 2014: 4000, 2013: 3500 },
  mazda: { 2026: 23000, 2025: 21000, 2024: 19000, 2023: 17000, 2022: 15000, 2021: 13500, 2020: 12000, 2019: 10500, 2018: 9500, 2017: 8500, 2016: 7500, 2015: 6500, 2014: 5500, 2013: 5000 },
  bmw: { 2026: 42000, 2025: 38000, 2024: 34000, 2023: 30000, 2022: 26000, 2021: 23000, 2020: 20000, 2019: 17000, 2018: 15000, 2017: 13000, 2016: 11000, 2015: 9500, 2014: 8000, 2013: 7000 },
  mercedes: { 2026: 45000, 2025: 40000, 2024: 36000, 2023: 32000, 2022: 28000, 2021: 25000, 2020: 22000, 2019: 19000, 2018: 16000, 2017: 14000, 2016: 12000, 2015: 10000, 2014: 8500, 2013: 7500 },
  audi: { 2026: 40000, 2025: 35000, 2024: 31000, 2023: 27000, 2022: 24000, 2021: 21000, 2020: 18000, 2019: 15500, 2018: 13500, 2017: 11500, 2016: 10000, 2015: 8500, 2014: 7500, 2013: 6500 },
  lexus: { 2026: 48000, 2025: 42000, 2024: 38000, 2023: 34000, 2022: 30000, 2021: 26000, 2020: 23000, 2019: 20000, 2018: 17000, 2017: 15000, 2016: 13000, 2015: 11000, 2014: 9500, 2013: 8000 },
  suzuki: { 2026: 14000, 2025: 12000, 2024: 10500, 2023: 9000, 2022: 8000, 2021: 7000, 2020: 6000, 2019: 5500, 2018: 5000, 2017: 4500, 2016: 4000, 2015: 3500, 2014: 3000, 2013: 2800 },
};

const MODEL_ADJUSTMENTS: Record<string, Record<string, number>> = {
  toyota: { 'corolla': 0, 'camry': 0.15, 'rav4': 0.25, 'land cruiser': 0.80, 'prado': 0.50, 'hilux': 0.30, 'yaris': -0.15, 'fortuner': 0.35 },
  honda: { 'civic': 0, 'accord': 0.10, 'crv': 0.20, 'hrv': 0.05, 'pilot': 0.35, 'city': -0.10 },
  hyundai: { 'accent': -0.10, 'elantra': 0, 'sonata': 0.15, 'tucson': 0.20, 'santa fe': 0.35, 'palisade': 0.50 },
  nissan: { 'sunny': -0.10, 'sentra': 0, 'altima': 0.15, 'xtrail': 0.20, 'patrol': 0.80, 'kicks': 0.05 },
  kia: { 'rio': -0.10, 'cerato': 0, 'optima': 0.10, 'sportage': 0.20, 'sorento': 0.35, 'picanto': -0.20 },
  mazda: { '2': -0.15, '3': 0, '6': 0.10, 'cx5': 0.20, 'cx9': 0.40, 'cx30': 0.10 },
  bmw: { '1 series': -0.15, '3 series': 0, '5 series': 0.20, '7 series': 0.50, 'x1': 0.10, 'x3': 0.25, 'x5': 0.45, 'x7': 0.70 },
  mercedes: { 'a class': -0.10, 'c class': 0, 'e class': 0.20, 's class': 0.50, 'gla': 0.10, 'glc': 0.25, 'gle': 0.40, 'gls': 0.60 },
};

const CONDITION_FACTORS: Record<string, number> = {
  'ممتازة': 0.15, 'EXCELLENT': 0.15, 'جيدة جداً': 0.05, 'VERY_GOOD': 0.05,
  'جيدة': -0.05, 'GOOD': -0.05, 'مقبولة': -0.15, 'FAIR': -0.15,
};

function normalizeBrand(brand: string): string {
  const lower = brand.toLowerCase().trim();
  const aliases: Record<string, string> = {
    'toyota': 'toyota', 'تويوتا': 'toyota', 'honda': 'honda', 'هوندا': 'honda',
    'hyundai': 'hyundai', 'هيونداي': 'hyundai', 'nissan': 'nissan', 'نيسان': 'nissan',
    'kia': 'kia', 'كيا': 'kia', 'mazda': 'mazda', 'مازدا': 'mazda',
    'bmw': 'bmw', 'بي ام': 'bmw', 'mercedes': 'mercedes', 'مرسيدس': 'mercedes',
    'audi': 'audi', 'اودي': 'audi', 'lexus': 'lexus', 'لكزس': 'lexus',
    'suzuki': 'suzuki', 'سوزوكي': 'suzuki', 'mg': 'mg', 'ام جي': 'mg',
    'chery': 'chery', 'شيري': 'chery', 'geely': 'geely', 'جيلي': 'geely',
    'byd': 'byd', 'haval': 'haval', 'هافال': 'haval',
  };
  return aliases[lower] || lower;
}

function calculateBasePrice(brand: string, model: string, year: number): number {
  const normalized = normalizeBrand(brand);
  const brandPrices = JORDAN_PRICES[normalized];
  if (!brandPrices) return 15000;
  const years = Object.keys(brandPrices).map(Number).sort((a, b) => b - a);
  let base = 0;
  if (year >= years[0]) base = brandPrices[years[0]] * 1.05;
  else if (year <= years[years.length - 1]) base = brandPrices[years[years.length - 1]] * 0.7;
  else {
    for (let i = 0; i < years.length - 1; i++) {
      if (year <= years[i] && year >= years[i + 1]) {
        const ratio = (years[i] - year) / (years[i] - years[i + 1]);
        base = brandPrices[years[i]] + ratio * (brandPrices[years[i + 1]] - brandPrices[years[i]]);
        break;
      }
    }
  }
  if (base === 0) base = brandPrices[years[0]] || 15000;
  const normalized2 = normalizeBrand(brand);
  const modelLower = model.toLowerCase().trim();
  const brandModels = MODEL_ADJUSTMENTS[normalized2];
  if (brandModels) {
    for (const [key, adj] of Object.entries(brandModels)) {
      if (modelLower.includes(key)) { base *= (1 + adj); break; }
    }
  }
  return Math.round(base);
}

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
  if (candidate.brand && normalizeBrand(candidate.brand) === normalizeBrand(car.brand)) score += 25;
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
  const basePrice = calculateBasePrice(car.brand, car.model, car.year);
  const factors = analyzeFactors(car);

  let totalImpact = 0;
  for (const factor of factors) totalImpact += factor.impact;
  totalImpact = Math.max(-0.50, Math.min(0.50, totalImpact));
  let fairPrice = Math.round(basePrice * (1 + totalImpact));
  let minPrice = Math.round(fairPrice * 0.85);
  let maxPrice = Math.round(fairPrice * 1.15);

  const similarCars = await getDbSimilarCars(car);
  const dbPrices = similarCars.map(c => c.price).filter(p => p > 0);
  const dbAvg = dbPrices.length > 0 ? Math.round(dbPrices.reduce((a, b) => a + b, 0) / dbPrices.length) : 0;

  let confidence = 60;
  const sources: string[] = ['تحليل ذكي'];

  // Try LLM analysis
  const llmResult = await analyzePriceWithLLM(car, similarCars, dbAvg);

  if (llmResult) {
    fairPrice = llmResult.fairPrice;
    minPrice = Math.round(fairPrice * 0.85);
    maxPrice = Math.round(fairPrice * 1.15);
    confidence = llmResult.confidence;
    sources.length = 0;
    sources.push('ذكاء اصطناعي (NVIDIA AI)');

    if (dbPrices.length >= 3) {
      fairPrice = Math.round(fairPrice * 0.7 + dbAvg * 0.3);
      confidence = Math.min(95, confidence + 5);
      sources.push(`JO Cars (${dbPrices.length} إعلان مشابه)`);
    }
  } else {
    // Fallback
    if (dbPrices.length >= 3) {
      fairPrice = Math.round(fairPrice * 0.5 + dbAvg * 0.5);
      confidence = 85;
      sources.push(`JO Cars (${dbPrices.length} إعلان مشابه)`);
    } else if (dbPrices.length >= 1) {
      fairPrice = Math.round(fairPrice * 0.7 + dbAvg * 0.3);
      confidence = 72;
      sources.push(`JO Cars (${dbPrices.length} إعلان)`);
    }
  }

  const assessment = generateAssessment(car.price || 0, fairPrice, llmResult?.factors || factors);
  const carName = `${car.brand} ${car.model} ${car.year}`;
  const headline = assessment.position === 'below' ? `${carName} — سعر أقل من السوق` : assessment.position === 'within' ? `${carName} — سعر عادل` : `${carName} — سعر أعلى من السوق`;
  const detail = `بناءً على تحليل ${similarCars.length} إعلان مشابه وبيانات السوق الأردني، السعر العادل المقدر هو ${fairPrice.toLocaleString()} د.أ. ${assessment.explanation}`;
  const recommendation = assessment.position === 'below' ? `يمكنك رفع السعر إلى ${fairPrice.toLocaleString()} د.أ` : assessment.position === 'within' ? 'سعرك مناسب ويمكنك المتابعة.' : `يُنصح بخفض السعر إلى ${fairPrice.toLocaleString()} د.أ`;

  return {
    valuation: { fairPrice, minPrice, maxPrice, confidence: Math.min(95, confidence), sources },
    assessment,
    factors: llmResult?.factors || factors,
    similarCars,
    summary: { headline, detail, recommendation },
  };
}
