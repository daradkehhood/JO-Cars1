/**
 * PriceEstimator v4.0.0 — NVIDIA AI-powered price estimation for the Jordanian car market.
 *
 * Architecture:
 *  1. PRIMARY: NVIDIA LLM estimates fair price using car specs + market data.
 *  2. FALLBACK: Local heuristic engine (original v3.0.0 logic) if LLM fails.
 *  3. Both paths use: OpenSooq live listings + JO Cars DB for market anchoring.
 *
 * The LLM receives car specs, Jordanian market context, and comparable listings,
 * then returns a realistic price estimate in JOD with reasoning.
 */

import { BaseAIModule, AIProviderType, AIResult, AIProgress } from './base';
import { chatCompletionJSON, type ChatMessage } from './nvidia-client';
import { getSystemPrompt } from './site-knowledge';
import { fetchOpenSooqListings, OpenSooqListing } from '@/lib/opensooq-scrape';
import {
  JORDAN_PRICES, MODEL_ADJUSTMENTS, CONDITION_FACTORS, TRANSMISSION_FACTORS,
  FUEL_FACTORS, BODY_TYPE_FACTORS, DRIVETRAIN_FACTORS,
  normalizeBrand as normalizeBrandShared, calculateBasePrice as calculateBasePriceShared,
  getModelAdjustment as getModelAdjustmentShared,
} from './brand-prices';

export interface PriceInput {
  brand: string;
  model: string;
  year: number;
  kilometers: number;
  condition: string;
  city: string;
  fuelType?: string;
  transmission?: string;
  engineCapacity?: number | string;
  bodyType?: string;
  drivetrain?: string;
  trim?: string;
  color?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isPaintOriginal?: boolean;
  listingPrice?: number;
  odometer?: number;
  ownerId?: string;
  carId?: string;
}

export interface SimilarListing {
  site: string;
  url: string;
  price: number;
  year: number;
  km: number;
  notes?: string;
}

export interface PriceOutput {
  minPrice: number;
  fairPrice: number;
  maxPrice: number;
  confidence: number;
  reasoning: string;
  marketFactors: string[];
  similarListings: SimilarListing[];
  sources: string[];
  isRealWebSearch: boolean;
}

function getEngineCapacityFactor(engineRaw: number | string | undefined): { factor: number; label: string } {
  if (!engineRaw) return { factor: 0, label: '' };
  let cc = 0;
  if (typeof engineRaw === 'number') {
    cc = engineRaw;
  } else {
    const s = String(engineRaw).toLowerCase().replace(/[^\d.]/g, '');
    const num = parseFloat(s);
    if (isNaN(num)) return { factor: 0, label: '' };
    cc = num < 10 ? num * 1000 : num;
  }
  if (cc <= 0) return { factor: 0, label: '' };
  if (cc >= 5000) return { factor: 0.15, label: `محرك ${Math.round(cc / 1000)} لتر — قوة كبيرة` };
  if (cc >= 4000) return { factor: 0.12, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 3500) return { factor: 0.10, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 3000) return { factor: 0.08, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 2500) return { factor: 0.06, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 2000) return { factor: 0.03, label: `محرك ${Math.round(cc / 1000)} لتر — الأكثر شيوعاً` };
  if (cc >= 1800) return { factor: 0.02, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 1500) return { factor: 0, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 1200) return { factor: -0.03, label: `محرك صغير ${Math.round(cc / 1000)} لتر` };
  return { factor: -0.06, label: `محرك صغير جداً ${Math.round(cc)} سمك` };
}

// ── LLM-based price estimation ──
interface LLMPriceResult {
  fairPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  reasoning: string;
  marketFactors: string[];
}

async function estimatePriceWithLLM(
  input: PriceInput,
  dbListings: SimilarListing[],
  osListings: OpenSooqListing[],
  osStats: { avg: number; median: number; count: number } | null
): Promise<LLMPriceResult | null> {
  try {
    const systemPrompt = getSystemPrompt('price-estimate');

    const comparableData = [];
    if (dbListings.length > 0) {
      comparableData.push(`إعلانات مشابهة من JO Cars (${dbListings.length} إعلان):`);
      for (const l of dbListings.slice(0, 5)) {
        comparableData.push(`  - ${l.notes}: ${l.price.toLocaleString()} د.أ (${l.year}, ${l.km.toLocaleString()} كم)`);
      }
    }
    if (osListings.length > 0) {
      comparableData.push(`إعلانات من السوق المفتوح (${osListings.length} إعلان):`);
      for (const l of osListings.slice(0, 5)) {
        comparableData.push(`  - ${l.title}: ${l.price.toLocaleString()} د.أ (${l.year}, ${(l.km || 0).toLocaleString()} كم)`);
      }
    }
    if (osStats) {
      comparableData.push(`إحصائيات السوق المفتوح: متوسط ${osStats.avg.toLocaleString()} د.أ، وسطي ${osStats.median.toLocaleString()} د.أ (${osStats.count} إعلان)`);
    }

    const userMessage = `قيّم السعر العادل لهذه السيارة في السوق الأردني:

المواصفات:
- الماركة: ${input.brand}
- الموديل: ${input.model}
- السنة: ${input.year}
- الكيلومترات: ${input.kilometers.toLocaleString()} كم
- الحالة: ${input.condition}
- المدينة: ${input.city}
- نوع الوقود: ${input.fuelType || 'غير محدد'}
- ناقل الحركة: ${input.transmission || 'غير محدد'}
- سعة المحرك: ${input.engineCapacity || 'غير محدد'}
- نوع الهيكل: ${input.bodyType || 'غير محدد'}
- الدفع: ${input.drivetrain || 'غير محدد'}
- اللون: ${input.color || 'غير محدد'}
- عدد الملاك: ${input.ownerCount || 1}
- مصدومة: ${input.isDamaged ? 'نعم' : 'لا'}
- ضمان: ${input.hasWarranty ? 'نعم' : 'لا'}
- سجل صيانة: ${input.hasServiceHistory ? 'نعم' : 'لا'}
- دهان أصلي: ${input.isPaintOriginal === false ? 'لا' : input.isPaintOriginal === true ? 'نعم' : 'غير محدد'}
- السعر المعلن: ${input.listingPrice ? input.listingPrice.toLocaleString() + ' د.أ' : 'غير محدد'}

${comparableData.length > 0 ? comparableData.join('\n') : 'لا تتوفر إعلانات مشابهة حالياً.'}

أجب بالـ JSON فقط:
{
  "fairPrice": <رقم - السعر العادل بالدينار الأردني>,
  "minPrice": <رقم - أدنى سعر منطقي>,
  "maxPrice": <رقم - أعلى سعر منطقي>,
  "confidence": <رقم 0-100>,
  "reasoning": "<نص عربي - تفسير السعر>",
  "marketFactors": ["<عامل 1>", "<عامل 2>", ...]
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const result = await chatCompletionJSON<LLMPriceResult>(messages, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    if (result && result.fairPrice > 0) {
      // Sanity check: clamp to reasonable range
      const basePrice = calculateBasePriceShared(input.brand, input.model, input.year);
      const minBound = Math.round(basePrice * 0.3);
      const maxBound = Math.round(basePrice * 2.5);
      result.fairPrice = Math.max(minBound, Math.min(maxBound, result.fairPrice));
      result.minPrice = Math.max(minBound, Math.min(result.fairPrice, result.minPrice || Math.round(result.fairPrice * 0.88)));
      result.maxPrice = Math.min(maxBound, Math.max(result.fairPrice, result.maxPrice || Math.round(result.fairPrice * 1.12)));
      result.confidence = Math.max(40, Math.min(95, result.confidence || 75));
      return result;
    }
    return null;
  } catch (error) {
    console.error('[PriceEstimator LLM] Error:', error);
    return null;
  }
}

// ── Local heuristic (original v3.0.0) as fallback ──
function buildLocalHeuristic(input: PriceInput): { factors: { name: string; impact: number; description: string }[]; total: number } {
  const factors: { name: string; impact: number; description: string }[] = [];
  let total = 1;

  const age = Math.max(0, new Date().getFullYear() - input.year);
  if (age === 0) { factors.push({ name: 'سنة الصنع', impact: 1.05, description: 'سيارة من موديل السنة' }); }
  else if (age === 1) { factors.push({ name: 'سنة الصنع', impact: 1.02, description: 'سيارة حديثة جداً' }); }
  else { const ageImpact = Math.max(0.7, 1 - (age - 1) * 0.005); factors.push({ name: 'سنة الصنع', impact: ageImpact, description: `عمرها ${age} سنة` }); }

  const expectedKm = Math.max(1, age * 20000);
  const kmRatio = input.kilometers / expectedKm;
  let kmImpact = 1;
  if (kmRatio > 1.5) kmImpact = 0.80;
  else if (kmRatio > 1.3) kmImpact = 0.85;
  else if (kmRatio > 1.1) kmImpact = 0.92;
  else if (kmRatio < 0.3) kmImpact = 1.12;
  else if (kmRatio < 0.5) kmImpact = 1.08;
  else if (kmRatio < 0.8) kmImpact = 1.03;
  factors.push({ name: 'عداد الكيلومترات', impact: kmImpact, description: `${input.kilometers.toLocaleString()} كم` });

  const condKey = input.condition && CONDITION_FACTORS[input.condition] ? input.condition : '';
  if (condKey) factors.push({ name: 'حالة السيارة', impact: 1 + CONDITION_FACTORS[condKey], description: input.condition });

  if (input.fuelType && FUEL_FACTORS[input.fuelType]) factors.push({ name: 'نوع الوقود', impact: 1 + FUEL_FACTORS[input.fuelType], description: input.fuelType });
  if (input.transmission && TRANSMISSION_FACTORS[input.transmission]) factors.push({ name: 'ناقل الحركة', impact: 1 + TRANSMISSION_FACTORS[input.transmission], description: input.transmission });
  if (input.bodyType && BODY_TYPE_FACTORS[input.bodyType]) factors.push({ name: 'نوع الهيكل', impact: 1 + BODY_TYPE_FACTORS[input.bodyType], description: input.bodyType });
  if (input.drivetrain && DRIVETRAIN_FACTORS[input.drivetrain]) factors.push({ name: 'الدفع', impact: 1 + DRIVETRAIN_FACTORS[input.drivetrain], description: input.drivetrain });

  if (input.ownerCount && input.ownerCount > 1) {
    factors.push({ name: 'عدد الملاك', impact: Math.max(0.90, 1 - (input.ownerCount - 1) * 0.025), description: `${input.ownerCount} ملاك` });
  }
  if (input.isDamaged) factors.push({ name: 'مصدومة سابقاً', impact: 0.80, description: 'سيارة مصدومة سابقاً' });
  if (input.isPaintOriginal === false) factors.push({ name: 'الدهان غير أصلي', impact: 0.96, description: 'الدهان غير أصلي' });
  if (input.hasWarranty) factors.push({ name: 'تحت الضمان', impact: 1.03, description: 'ضمان ساري' });
  if (input.hasServiceHistory) factors.push({ name: 'سجل صيانة', impact: 1.04, description: 'سجل صيانة كامل' });

  const engFactor = getEngineCapacityFactor(input.engineCapacity);
  if (engFactor.factor !== 0) factors.push({ name: 'سعة المحرك', impact: 1 + engFactor.factor, description: engFactor.label });

  for (const f of factors) total *= f.impact;
  total = Math.max(0.75, Math.min(1.25, total));

  return { factors, total };
}

async function getDbSimilarCars(input: PriceInput): Promise<{ prices: number[]; listings: SimilarListing[] }> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const where: Record<string, unknown> = {
      status: 'APPROVED', deletedAt: null, price: { gt: 0 },
      year: { gte: input.year - 2, lte: input.year + 2 },
    };
    if (input.brand) {
      where.OR = [
        { brand: { nameAr: { contains: input.brand } } },
        { brand: { nameEn: { contains: input.brand } } },
      ];
    }
    const cars = await prisma.car.findMany({
      where, take: 50, orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, price: true, year: true, kilometers: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } }, city: { select: { nameAr: true } } },
    });
    let filtered = cars;
    if (input.model && filtered.length >= 3) {
      const f = filtered.filter((c: any) => (c.model?.nameAr || '').includes(input.model) || (c.model?.nameEn || '').includes(input.model));
      if (f.length >= 3) filtered = f;
    }
    const prices = filtered.map((c: any) => c.price).filter((p: number) => p > 0);
    const listings: SimilarListing[] = filtered.slice(0, 8).map((c: any) => ({
      site: 'JO Cars', url: c.slug ? `/cars/${c.slug}` : '', price: c.price, year: c.year, km: c.kilometers,
      notes: `${c.brand?.nameAr || ''} ${c.model?.nameAr || ''} ${c.year}${c.city?.nameAr ? ' — ' + c.city.nameAr : ''}`,
    }));
    return { prices, listings };
  } catch { return { prices: [], listings: [] }; }
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export class PriceEstimator extends BaseAIModule<PriceInput, PriceOutput> {
  name = 'PriceEstimator';
  version = '4.0.0';
  provider: AIProviderType = 'local';

  async process(input: PriceInput, onProgress?: (progress: AIProgress) => void): Promise<AIResult<PriceOutput>> {
    const startTime = Date.now();
    if (!this.validate(input)) {
      return { success: false, error: 'بيانات غير صالحة للتقييم', processingTime: Date.now() - startTime };
    }

    // Step 1 — base price from reference table
    onProgress?.({ stage: 'base', progress: 15, message: 'حساب القيمة الأساسية' });
    const basePrice = calculateBasePriceShared(input.brand, input.model, input.year);

    // Step 2 — fetch market data (DB + OpenSooq) in parallel
    onProgress?.({ stage: 'market', progress: 35, message: 'جمع بيانات السوق' });

    const [dbResult, openSooqResult] = await Promise.all([
      getDbSimilarCars(input),
      fetchOpenSooqListings(input.brand, input.model, input.year).catch(() => null),
    ]);

    const dbPrices = dbResult.prices;
    const dbListings = dbResult.listings;
    const dbAvg = average(dbPrices);
    const dbMedian = median(dbPrices);

    const osStats = openSooqResult?.stats || null;
    const osListings: OpenSooqListing[] = openSooqResult?.listings || [];
    const osCount = osStats ? osStats.count : 0;

    // Step 3 — try NVIDIA LLM estimation
    onProgress?.({ stage: 'ai', progress: 60, message: 'تحليل بالذكاء الاصطناعي' });

    let llmResult = await estimatePriceWithLLM(input, dbListings, osListings, osStats);

    let fairPrice: number;
    let confidence: number;
    let reasoning: string;
    let marketFactors: string[];
    let sources: string[] = [];
    let isUsedLLM = false;

    if (llmResult) {
      // LLM succeeded — use its result and blend with market data
      isUsedLLM = true;
      fairPrice = llmResult.fairPrice;
      confidence = llmResult.confidence;
      reasoning = llmResult.reasoning;
      marketFactors = llmResult.marketFactors;
      sources = ['ذكاء اصطناعي (NVIDIA AI)'];

      // Blend with market data if available
      if (dbPrices.length >= 3 && osCount >= 3) {
        const blended = Math.round(fairPrice * 0.6 + dbMedian * 0.2 + osStats!.median * 0.2);
        fairPrice = blended;
        confidence = Math.min(95, confidence + 5);
        sources.push(`JO Cars (${dbPrices.length} إعلان)`);
        sources.push(`السوق المفتوح (${osCount} إعلان)`);
      } else if (dbPrices.length >= 3) {
        fairPrice = Math.round(fairPrice * 0.75 + dbMedian * 0.25);
        confidence = Math.min(95, confidence + 3);
        sources.push(`JO Cars (${dbPrices.length} إعلان)`);
      } else if (osCount >= 3) {
        fairPrice = Math.round(fairPrice * 0.75 + osStats!.median * 0.25);
        confidence = Math.min(95, confidence + 3);
        sources.push(`السوق المفتوح (${osCount} إعلان)`);
      }
    } else {
      // LLM failed — fall back to local heuristic
      onProgress?.({ stage: 'fallback', progress: 70, message: 'استخدام التحليل المحلي' });

      const { factors, total } = buildLocalHeuristic(input);
      let heuristicPrice = Math.round(basePrice * total);
      heuristicPrice = Math.max(500, heuristicPrice);

      marketFactors = factors.map((f) => `${f.name}: ${f.description}`);

      if (dbPrices.length >= 3 && osCount >= 3) {
        fairPrice = Math.round(heuristicPrice * 0.30 + dbMedian * 0.35 + osStats!.median * 0.35);
        confidence = 90;
        sources = ['تحليل محلي', `JO Cars (${dbPrices.length} إعلان)`, `السوق المفتوح (${osCount} إعلان)`];
      } else if (osCount >= 3) {
        fairPrice = Math.round(heuristicPrice * 0.40 + osStats!.median * 0.60);
        confidence = 84;
        sources = ['تحليل محلي', `السوق المفتوح (${osCount} إعلان)`];
      } else if (dbPrices.length >= 3) {
        fairPrice = Math.round(heuristicPrice * 0.55 + dbMedian * 0.45);
        confidence = 78;
        sources = ['تحليل محلي', `JO Cars (${dbPrices.length} إعلان)`];
      } else {
        fairPrice = heuristicPrice;
        confidence = 62;
        sources = ['تحليل محلي ذكي'];
      }

      const topFactors = [...factors].sort((a, b) => Math.abs(b.impact - 1) - Math.abs(a.impact - 1)).slice(0, 4);
      reasoning = `قيمة أساسية ${basePrice.toLocaleString()} د.أ. بعد تطبيق ${factors.length} عامل (أبرزها: ${topFactors.map(f => f.name).join('، ')})، السعر المُقدّر ${fairPrice.toLocaleString()} د.أ.`;
    }

    // Step 4 — raise confidence for well-known brands
    const brandKey = normalizeBrandShared(input.brand);
    if (JORDAN_PRICES[brandKey]) confidence += 4;
    if (getModelAdjustmentShared(input.brand, input.model) !== 0) confidence += 4;
    const completenessFields = [input.fuelType, input.transmission, input.bodyType, input.drivetrain, input.color, input.engineCapacity, input.trim];
    confidence += completenessFields.filter(Boolean).length * 2;
    confidence = Math.min(95, Math.max(40, confidence));

    // Step 5 — output bounds
    const minPrice = Math.round(fairPrice * 0.88);
    const maxPrice = Math.round(fairPrice * 1.12);

    // Step 6 — combined listing catalog
    const similarListings: SimilarListing[] = [];
    const seenUrls = new Set<string>();
    for (const l of osListings) {
      if (seenUrls.has(l.url)) continue;
      seenUrls.add(l.url);
      similarListings.push({ site: l.site, url: l.url, price: l.price, year: l.year ?? input.year, km: l.km ?? 0, notes: `${l.title}${l.city ? ' — ' + l.city : ''}` });
    }
    for (const l of dbListings) {
      if (seenUrls.has(l.url)) continue;
      seenUrls.add(l.url);
      similarListings.push(l);
    }

    // Step 7 — reasoning suffix
    if (osCount > 0) reasoning += ` تم جلب ${osCount} إعلان من السوق المفتوح.`;
    if (dbPrices.length > 0) reasoning += ` تمت المطابقة مع ${dbPrices.length} إعلان من JO Cars.`;
    reasoning += ` نطاق معقول: ${minPrice.toLocaleString()} — ${maxPrice.toLocaleString()} د.أ.`;

    onProgress?.({ stage: 'done', progress: 100, message: 'اكتمل التقييم' });

    return {
      success: true,
      data: {
        minPrice, fairPrice, maxPrice, confidence, reasoning, marketFactors,
        similarListings: similarListings.slice(0, 10), sources, isRealWebSearch: osCount > 0,
      },
      confidence, processingTime: Date.now() - startTime,
    };
  }
}

export const priceEstimator = new PriceEstimator({ type: 'local' });
