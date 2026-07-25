/**
 * PriceEstimator — realistic AI price valuation for the Jordanian car market.
 *
 * Strategy (defense-in-depth):
 *  1. Call OpenAI Responses API with the `web_search` tool — the model actually
 *     browses Jordanian car listing sites (OpenSooq, JoCars, Q8Show, AutotraderJo)
 *     and returns real listings + fair price estimation.
 *  2. In parallel, query our own database for approved similar listings.
 *  3. Blend the three signal sources (web, DB, heuristic) by confidence.
 *  4. If OpenAI is unavailable or fails, gracefully fall back to the local
 *     heuristic (preserves UI without crashing).
 */

import { BaseAIModule, AIProviderType, AIResult, AIWebSearchResult } from './base';

export interface PriceInput {
  brand: string;
  model: string;
  year: number;
  kilometers: number;
  condition: string;
  city: string;
  fuelType?: string;
  transmission?: string;
  engineCapacity?: number;
  bodyType?: string;
  drivetrain?: string;
  odometer?: number;
  ownerId?: string;
  carId?: string;
  trim?: string;
  color?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isPaintOriginal?: boolean;
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

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: 'ممتازة', VERY_GOOD: 'جيدة جداً', GOOD: 'جيدة',
  FAIR: 'مقبولة', NEEDS_MAINTENANCE: 'تحتاج صيانة', NEEDS_INSPECTION: 'تحتاج فحص',
};

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هايبرد',
  ELECTRIC: 'كهرباء', PLUGIN_HYBRID: 'هايبرد بلج إن',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIC: 'أوتوماتيك', MANUAL: 'يدوي', CVT: 'CVT', DCT: 'DCT', SEMI_AUTOMATIC: 'نصف أوتوماتيك',
};

const BODY_LABELS: Record<string, string> = {
  SUV: 'SUV', SEDAN: 'سيدان', HATCHBACK: 'هاتشباك', COUPE: 'كوبيه',
  CONVERTIBLE: 'كابريوليه', WAGON: 'ستيشن', PICKUP: 'بيك أب', VAN: 'فان', MINIVAN: 'ميني فان',
};

const DRIVETRAIN_LABELS: Record<string, string> = {
  FWD: 'دفع أمامي', RWD: 'دفع خلفي', AWD: 'دفع رباعي دائم', FOUR_WD: 'دفع رباعي',
};

export class PriceEstimator extends BaseAIModule<PriceInput, PriceOutput> {
  name = 'PriceEstimator';
  version = '2.0.0';
  provider: AIProviderType = 'openai';

  async process(input: PriceInput): Promise<AIResult<PriceOutput>> {
    const startTime = Date.now();

    if (!this.validate(input)) {
      return { success: false, error: 'Invalid input', processingTime: Date.now() - startTime };
    }

    const enabled = this.isAIReady();

    // Run web search + DB lookup in parallel
    const [webResult, dbPrices] = await Promise.all([
      enabled ? this.callWebSearch(input) : Promise.resolve<AIWebSearchResult>({ text: '', citedUrls: [], success: false }),
      this.getDbSimilarPrices(input),
    ]);

    // Heuristic baseline (always computed, used as fallback + blend component)
    const heuristic = this.heuristicEstimate(input);

    // Parse web listings if available
    let webListings: SimilarListing[] = [];
    let webFairPrice = 0;
    let webReasoning = '';
    let webFactors: string[] = [];
    let webConfidence = 0;
    if (webResult.success && webResult.text) {
      const parsed = this.parseJSON<any>(webResult.text);
      if (parsed) {
        if (Array.isArray(parsed.similarListings)) {
          webListings = parsed.similarListings
            .filter((l: any) => l && l.price && l.price > 0)
            .map((l: any) => ({
              site: String(l.site || l.source || 'ويب').slice(0, 80),
              url: String(l.url || '').slice(0, 500),
              price: Math.max(0, Math.round(Number(l.price) || 0)),
              year: Math.round(Number(l.year) || input.year),
              km: Math.max(0, Math.round(Number(l.km) || Number(l.kilometers) || 0)),
              notes: l.notes ? String(l.notes).slice(0, 200) : undefined,
            }));
        }
        webFairPrice = Math.max(0, Math.round(Number(parsed.fairPrice) || 0));
        webReasoning = String(parsed.reasoning || '').slice(0, 1500);
        webFactors = Array.isArray(parsed.marketFactors)
          ? parsed.marketFactors.map((f: any) => String(f).slice(0, 200)).slice(0, 12)
          : [];
        webConfidence = Math.min(95, Math.max(0, Math.round(Number(parsed.confidence) || 0)));
      }
    }

    // Compute blended fair price
    let finalFairPrice = heuristic.fairPrice;
    let confidence = 55;
    const sources: string[] = ['تحليل محلي ذكي'];

    if (webFairPrice > 0 && webListings.length >= 3) {
      // Strong web signal — 50% web / 30% DB / 20% heuristic
      const dbAvg = dbPrices.length > 0 ? this.average(dbPrices) : heuristic.fairPrice;
      finalFairPrice = Math.round(webFairPrice * 0.5 + dbAvg * 0.3 + heuristic.fairPrice * 0.2);
      confidence = Math.min(92, Math.max(75, webConfidence));
      sources.push(`بحث ويب على مواقع أردنية (${webListings.length} إعلان حقيقي)`);
      if (dbPrices.length > 0) sources.push(`JO Cars (${dbPrices.length} إعلان محلي)`);
    } else if (webFairPrice > 0) {
      // Modest web signal — 35% web / 35% DB / 30% heuristic
      const dbAvg = dbPrices.length > 0 ? this.average(dbPrices) : heuristic.fairPrice;
      finalFairPrice = Math.round(webFairPrice * 0.35 + dbAvg * 0.35 + heuristic.fairPrice * 0.3);
      confidence = Math.min(82, Math.max(65, webConfidence - 10));
      sources.push(`بحث ويب (${webListings.length} إعلان)`);
      if (dbPrices.length > 0) sources.push(`JO Cars (${dbPrices.length} إعلان)`);
    } else if (dbPrices.length >= 3) {
      // DB only — 70% DB / 30% heuristic
      const dbAvg = this.average(dbPrices);
      finalFairPrice = Math.round(dbAvg * 0.7 + heuristic.fairPrice * 0.3);
      confidence = 78;
      sources.push(`JO Cars (${dbPrices.length} إعلان مشابه)`);
    } else if (dbPrices.length >= 1) {
      const dbAvg = this.average(dbPrices);
      finalFairPrice = Math.round(dbAvg * 0.5 + heuristic.fairPrice * 0.5);
      confidence = 68;
      sources.push(`JO Cars (${dbPrices.length} إعلان)`);
    }

    const minPrice = Math.round(finalFairPrice * 0.88);
    const maxPrice = Math.round(finalFairPrice * 1.12);

    // Combine factors
    const allFactors = [...new Set([...webFactors, ...heuristic.factors])].slice(0, 10);

    // Reasoning
    let reasoning = webReasoning;
    if (!reasoning) {
      reasoning = heuristic.reasoning;
      if (dbPrices.length > 0) {
        reasoning += ` بناءً على ${dbPrices.length} إعلان مشابه في JO Cars (متوسط ${this.average(dbPrices).toLocaleString()} د.أ).`;
      }
    }

    return {
      success: true,
      data: {
        minPrice,
        fairPrice: finalFairPrice,
        maxPrice,
        confidence,
        reasoning,
        marketFactors: allFactors,
        similarListings: webListings.slice(0, 8),
        sources,
        isRealWebSearch: webResult.success && webListings.length > 0,
      },
      confidence,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Call OpenAI Responses API with web_search tool.
   * The model browses real Jordanian car market sites and returns JSON.
   */
  private async callWebSearch(input: PriceInput): Promise<AIWebSearchResult> {
    const condLabel = CONDITION_LABELS[input.condition] || input.condition || 'غير محدد';
    const fuelLabel = input.fuelType ? (FUEL_LABELS[input.fuelType] || input.fuelType) : 'غير محدد';
    const transLabel = input.transmission ? (TRANSMISSION_LABELS[input.transmission] || input.transmission) : 'غير محدد';
    const bodyLabel = input.bodyType ? (BODY_LABELS[input.bodyType] || input.bodyType) : '';
    const driveLabel = input.drivetrain ? (DRIVETRAIN_LABELS[input.drivetrain as keyof typeof DRIVETRAIN_LABELS] || '') : '';

    const prompt = `أنت خبير تقييم سيارات متخصص في السوق الأردني. مهمتك تقدير سعر عادل وواقعي لسيارة معروضة للبيع في الأردن.

بيانات السيارة المراد تقييمها:
- الشركة: ${input.brand}
- الموديل: ${input.model}
- سنة الصنع: ${input.year}
- الكيلومترات: ${input.kilometers.toLocaleString()} كم
- الحالة: ${condLabel}
- المحافظة: ${input.city}
- نوع الوقود: ${fuelLabel}
- ناقل الحركة: ${transLabel}
${bodyLabel ? `- نوع الهيكل: ${bodyLabel}` : ''}
${driveLabel ? `- الدفع: ${driveLabel}` : ''}
${input.engineCapacity ? `- سعة المحرك: ${input.engineCapacity}` : ''}
${input.color ? `- اللون: ${input.color}` : ''}
${input.ownerCount ? `- عدد الملاك السابقين: ${input.ownerCount}` : ''}
${input.isDamaged ? '- السيارة مصدومة سابقاً' : '- غير مصدومة'}
${input.hasWarranty ? '- تحت الضمان' : ''}
${input.hasServiceHistory ? '- يوجد سجل صيانة' : ''}
${input.isPaintOriginal === false ? '- الدهان غير أصلي' : ''}

التعليمات:
1. استخدم أداة web_search للبحث عن أسعار ${input.brand} ${input.model} موديل ${input.year} (سنة الصنع ±2) مع كيلومترات مماثلة، المباعة حالياً في الأردن.
2. ابحث في مواقع محددة: "jo.opensooq.com"، "q8.show"، "autotrader.jo"، "olx.jo"، "facebook.com/marketplace" + الأردن.
3. استند فقط إلى إعلانات حقيقية وجدتها بالفعل في بحثك — لا تخترع أسعاراً.
4. إذا لم تجد إعلانات كافية، اذكر ذلك بصراحة في reasoning وقلل confidence.

أعد النتيجة بصيغة JSON فقط (بدون نثر نصAround it):
{
  "similarListings": [
    { "site": "OpenSooq", "url": "https://...", "price": 15000, "year": 2021, "km": 60000, "notes": "اختياري" }
  ],
  "fairPrice": 14500,
  "minPrice": 13500,
  "maxPrice": 15500,
  "confidence": 85,
  "reasoning": "شرح مختصر لقرار التقييم بالعربية، مبنياً على الإعلانات الحقيقية التي وجدتها",
  "marketFactors": ["العامل الأول", "العامل الثاني"]
}`;

    const systemPrompt = 'أنت مساعد موثوق متخصص في سوق السيارات الأردني. كل أسعارتك بالدينار الأردني (JOD). لا تخترع إعلانات أو روابط. ابحث فعلياً عبر web_search ولا تعتمد على معرفتك السابقة فقط.';

    return this.callAIWithWebSearch(prompt, systemPrompt, {
      temperature: 0.3,
      maxTokens: 2500,
      jsonMode: true,
    });
  }

  /**
   * Get similar car prices from the local JO Cars database.
   */
  private async getDbSimilarPrices(input: PriceInput): Promise<number[]> {
    try {
      const { default: prisma } = await import('@/lib/prisma');
      const where: Record<string, unknown> = {
        status: 'APPROVED',
        deletedAt: null,
        price: { gt: 0 },
        year: { gte: input.year - 2, lte: input.year + 2 },
      };
      if (input.brand) {
        where.OR = [
          { brand: { nameAr: { contains: input.brand } } },
          { brand: { nameEn: { contains: input.brand } } },
        ];
      }
      const cars = await prisma.car.findMany({
        where,
        take: 50,
        select: { price: true, model: { select: { nameAr: true, nameEn: true } } },
      });
      let filtered = cars;
      if (input.model && cars.length >= 3) {
        const f = cars.filter((c: any) =>
          (c.model?.nameAr || '').includes(input.model) || (c.model?.nameEn || '').includes(input.model)
        );
        if (f.length >= 3) filtered = f;
      }
      return filtered.map((c: any) => c.price).filter((p: number) => p > 0);
    } catch {
      return [];
    }
  }

  private average(nums: number[]): number {
    if (nums.length === 0) return 0;
    return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  }

  /**
   * Heuristic baseline estimate (used as fallback + blend component).
   * Keeps the original JORDAN_PRICES table approach so the site works
   * even if OpenAI is offline.
   */
  private heuristicEstimate(input: PriceInput): { fairPrice: number; factors: string[]; reasoning: string } {
    const basePrice = this.estimateBasePrice(input.brand, input.model, input.year);
    const kmDeduction = Math.min(input.kilometers * 0.05, basePrice * 0.3);
    let estimatedPrice = Math.max(basePrice - kmDeduction, 500);

    const factors: string[] = [];
    const condMap: Record<string, number> = {
      EXCELLENT: 1.10, VERY_GOOD: 1.04, GOOD: 0.96, FAIR: 0.85,
      NEEDS_MAINTENANCE: 0.75, NEEDS_INSPECTION: 0.70,
    };
    if (input.condition && condMap[input.condition]) {
      estimatedPrice *= condMap[input.condition];
      factors.push(`حالة السيارة: ${CONDITION_LABELS[input.condition] || input.condition}`);
    }
    if (input.isDamaged) { estimatedPrice *= 0.80; factors.push('مصدومة سابقاً'); }
    if (input.isPaintOriginal === false) { estimatedPrice *= 0.96; factors.push('الدهان غير أصلي'); }
    if (input.hasWarranty) { estimatedPrice *= 1.03; factors.push('تحت الضمان'); }
    if (input.hasServiceHistory) { estimatedPrice *= 1.04; factors.push('سجل صيانة كامل'); }
    if (input.ownerCount && input.ownerCount > 1) {
      estimatedPrice *= Math.max(0.92, 1 - (input.ownerCount - 1) * 0.02);
      factors.push(`عدد الملاك: ${input.ownerCount}`);
    }

    const fairPrice = Math.round(estimatedPrice);
    return {
      fairPrice,
      factors,
      reasoning: `تقدير مبدئي بناءً على بيانات السوق الأردنية العامة. سعر القاعدة للموديل ${basePrice.toLocaleString()} د.أ مع تعديلات حسب الكيلومترات والحالة والإضافات.`,
    };
  }

  private estimateBasePrice(brand: string, model: string, year: number): number {
    const basePrices: Record<string, number> = {
      'تويوتا': 25000, 'هيونداي': 18000, 'كيا': 17000, 'نيسان': 22000,
      'مرسيدس': 45000, 'بي إم دبليو': 40000, 'هوندا': 20000, 'ميتسوبيشي': 16000,
      'شيفروليه': 18000, 'فورد': 20000, 'لكزس': 35000, 'مازدا': 19000,
      'فولكسفاجن': 20000, 'أودي': 35000, 'بورش': 60000, 'جيب': 25000,
    };
    const age = Math.max(0, new Date().getFullYear() - year);
    const depreciationRate = Math.min(age * 0.08, 0.7);
    const base = basePrices[brand] || 20000;
    return Math.round(base * (1 - depreciationRate));
  }
}

export const priceEstimator = new PriceEstimator({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
});
