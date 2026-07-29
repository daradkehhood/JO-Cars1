/**
 * ConditionScorer v4.0.0 — NVIDIA AI-powered car condition analysis.
 *
 * Architecture:
 *  1. PRIMARY: NVIDIA LLM analyzes car condition from specs + description.
 *  2. FALLBACK: Local heuristic engine (original v3.1.0 logic) if LLM fails.
 */
import OpenAI from 'openai';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'z-ai/glm-5.2';
import { BaseAIModule, AIProviderType, AIResult } from './base';
import { chatCompletionJSON, type ChatMessage } from './nvidia-client';
import { getSystemPrompt } from './site-knowledge';

export interface ConditionInput {
  images: string[];
  kilometers: number;
  year: number;
  transmission?: string;
  condition?: string;
  description?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  isPaintOriginal?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  fuelType?: string;
  bodyType?: string;
  engineCapacity?: number | string;
  color?: string;
  city?: string;
  brand?: string;
  model?: string;
}

export interface ConditionFactor {
  name: string;
  score: number;
  description: string;
}

interface DamageItem {
  part: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

export interface ConditionOutput {
  score: number;
  label: string;
  exteriorScore: number;
  interiorScore: number;
  engineBayScore: number;
  factors: ConditionFactor[];
  damages: DamageItem[];
  summary: string;
  isRealVision: boolean;
}

interface LLMConditionResult {
  score: number;
  label: string;
  exteriorScore: number;
  interiorScore: number;
  engineBayScore: number;
  factors: ConditionFactor[];
  damages: DamageItem[];
  summary: string;
}

// ── LLM-based condition analysis ──
async function analyzeConditionWithLLM(input: ConditionInput): Promise<LLMConditionResult | null> {
  try {
    const systemPrompt = getSystemPrompt('condition');

    const userMessage = `حلّل حالة هذه السيارة وقدم تقييم شامل:

المواصفات:
- الماركة: ${input.brand || 'غير محدد'}
- الموديل: ${input.model || 'غير محدد'}
- السنة: ${input.year}
- الكيلومترات: ${input.kilometers.toLocaleString()} كم
- الحالة المعلنة: ${input.condition || 'غير محددة'}
- نوع الوقود: ${input.fuelType || 'غير محدد'}
- ناقل الحركة: ${input.transmission || 'غير محدد'}
- سعة المحرك: ${input.engineCapacity || 'غير محدد'}
- نوع الهيكل: ${input.bodyType || 'غير محدد'}
- اللون: ${input.color || 'غير محدد'}
- المدينة: ${input.city || 'غير محددة'}
- عدد الملاك: ${input.ownerCount || 1}
- مصدومة سابقاً: ${input.isDamaged ? 'نعم' : 'لا'}
- دهان أصلي: ${input.isPaintOriginal === false ? 'لا' : input.isPaintOriginal === true ? 'نعم' : 'غير محدد'}
- ضمان: ${input.hasWarranty ? 'نعم' : 'لا'}
- سجل صيانة: ${input.hasServiceHistory ? 'نعم' : 'لا'}
- وصف الإعلان: ${input.description || 'لا يوجد وصف'}

أجب بالـ JSON فقط:
{
  "score": <رقم 0-100 - الدرجة العامة>,
  "label": "<الحالة: ممتازة/جيدة جداً/جيدة/مقبولة/تحتاج صيانة/سيئة>",
  "exteriorScore": <رقم 0-100>,
  "interiorScore": <رقم 0-100>,
  "engineBayScore": <رقم 0-100>,
  "factors": [
    { "name": "<اسم العامل>", "score": <0-100>, "description": "<وصف>" }
  ],
  "damages": [
    { "part": "<الجزء>", "severity": "<minor/moderate/severe>", "description": "<الوصف>" }
  ],
  "summary": "<ملخص شامل بالعربية>"
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const result = await chatCompletionJSON<LLMConditionResult>(messages, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    if (result && result.score >= 0 && result.score <= 100) {
      result.score = Math.max(0, Math.min(100, result.score));
      result.exteriorScore = Math.max(0, Math.min(100, result.exteriorScore || 75));
      result.interiorScore = Math.max(0, Math.min(100, result.interiorScore || 75));
      result.engineBayScore = Math.max(0, Math.min(100, result.engineBayScore || 75));
      result.label = result.label || 'جيدة';
      result.factors = result.factors || [];
      result.damages = result.damages || [];
      result.summary = result.summary || '';
      return result;
    }
    return null;
  } catch (error) {
    console.error('[ConditionScorer LLM] Error:', error);
    return null;
  }
}

// ── Local heuristic (original v3.1.0) as fallback ──
const SELLER_CONDITION_BASE: Record<string, number> = {
  EXCELLENT: 95, 'ممتازة': 95,
  VERY_GOOD: 82, 'جيدة جداً': 82,
  GOOD: 68, 'جيدة': 68,
  FAIR: 48, 'مقبولة': 48,
  NEEDS_MAINTENANCE: 28, 'تحتاج صيانة': 28,
  NEEDS_INSPECTION: 18, 'تحتاج فحص': 18,
};

const EXPECTED_KM_PER_YEAR = 20000;

function scoreToLabel(score: number): string {
  if (score >= 90) return 'ممتازة';
  if (score >= 78) return 'جيدة جداً';
  if (score >= 62) return 'جيدة';
  if (score >= 42) return 'مقبولة';
  if (score >= 22) return 'تحتاج صيانة';
  return 'سيئة';
}

function analyzeDescription(description: string | undefined): {
  positiveSignals: string[];
  negativeSignals: string[];
  scoreAdjustment: number;
} {
  const result = { positiveSignals: [] as string[], negativeSignals: [] as string[], scoreAdjustment: 0 };
  if (!description) return result;
  const desc = description.toLowerCase();

  const positivePatterns: Array<{ pattern: RegExp; label: string; adjustment: number }> = [
    { pattern: /بالة\s+(الصيانة|الضمان|التشييك|الفحص)/, label: 'بالة الصيانة/الضمان', adjustment: 3 },
    { pattern: /(ممتازة|ممتاز|نظيفة|نظيف|جديدة|جديد)/, label: 'حالة ممتازة مذكورة', adjustment: 2 },
    { pattern: /(أول\s+مالك|مالك\s+واحد|أول\s+يد)/, label: 'أول مالك', adjustment: 4 },
    { pattern: /(ضمان\s+الوكالة|ضمان\s+المصنع|تحت\s+الضمان)/, label: 'ضمان الوكالة', adjustment: 3 },
    { pattern: /(سجل\s+صيانة|صيانة\s+دورية)/, label: 'سجل صيانة', adjustment: 3 },
    { pattern: /(بالة\s+(الحوادث|التصادم))/, label: 'بدون حوادث', adjustment: 3 },
    { pattern: /(أصلية|أصلي)/, label: 'أصلي', adjustment: 2 },
  ];

  const negativePatterns: Array<{ pattern: RegExp; label: string; adjustment: number }> = [
    { pattern: /(مصدومة?|حادث|تصادم|تصطدم)/, label: 'حادث مذكور', adjustment: -5 },
    { pattern: /(بلا\s+صيانة|بدون\s+صيانة|غير\s+صيانة)/, label: 'بدون صيانة', adjustment: -4 },
    { pattern: /(تحتاج\s+(إصلاح|صيانة|قطع))/, label: 'تحتاج إصلاح', adjustment: -3 },
    { pattern: /(خربان|معطل|تالف)/, label: 'تلف مذكور', adjustment: -4 },
    { pattern: /(بالة\s+(الحوادث|التصادم))/, label: 'حادث سابق', adjustment: -6 },
  ];

  for (const p of positivePatterns) {
    if (p.pattern.test(desc)) { result.positiveSignals.push(p.label); result.scoreAdjustment += p.adjustment; }
  }
  for (const p of negativePatterns) {
    if (p.pattern.test(desc)) { result.negativeSignals.push(p.label); result.scoreAdjustment += p.adjustment; }
  }
  result.scoreAdjustment = Math.max(-15, Math.min(15, result.scoreAdjustment));
  return result;
}

function analyzeHighKm(kilometers: number, year: number, hasServiceHistory: boolean): { penalty: number; label: string } {
  const age = Math.max(1, new Date().getFullYear() - year);
  const kmPerYear = kilometers / age;
  if (kmPerYear > 30000) return { penalty: hasServiceHistory ? -8 : -15, label: 'كيلومترات مرتفعة جداً (>30,000 كم/سنة)' };
  if (kmPerYear > 25000) return { penalty: hasServiceHistory ? -4 : -8, label: 'كيلومترات مرتفعة (>25,000 كم/سنة)' };
  return { penalty: 0, label: '' };
}

function evaluateLocal(input: ConditionInput): ConditionOutput {
  const age = Math.max(0, new Date().getFullYear() - input.year);
  const kmPerYear = age > 0 ? input.kilometers / age : input.kilometers;
  const kmDeviation = kmPerYear / EXPECTED_KM_PER_YEAR;

  const descAnalysis = analyzeDescription(input.description);
  const highKm = analyzeHighKm(input.kilometers, input.year, !!input.hasServiceHistory);

  let exterior = 78;
  if (input.isPaintOriginal === true) exterior += 12;
  else if (input.isPaintOriginal === false) exterior -= 18;
  if (input.isDamaged) exterior -= 25;
  exterior -= Math.min(15, age * 1.2);
  if (descAnalysis.positiveSignals.some(s => s.includes('دهان'))) exterior += 3;
  if (descAnalysis.negativeSignals.some(s => s.includes('حادث') || s.includes('صدمة'))) exterior -= 5;
  exterior = Math.max(0, Math.min(100, exterior));

  let interior = 78;
  if (kmDeviation < 0.7) interior += 12;
  else if (kmDeviation < 1.0) interior += 6;
  else if (kmDeviation > 1.5) interior -= 15;
  else if (kmDeviation > 1.2) interior -= 8;
  if (input.ownerCount === 1) interior += 4;
  else if (input.ownerCount && input.ownerCount >= 3) interior -= 6;
  interior -= Math.min(12, age * 1);
  const sellerCondBase = input.condition ? SELLER_CONDITION_BASE[input.condition] : undefined;
  if (sellerCondBase !== undefined) interior = Math.round((interior + sellerCondBase) / 2);
  interior = Math.max(0, Math.min(100, interior));

  let engineBay = 75;
  if (input.hasServiceHistory) engineBay += 14;
  if (input.hasWarranty) engineBay += 8;
  if (kmDeviation > 1.5) engineBay -= 20;
  else if (kmDeviation > 1.2) engineBay -= 10;
  else if (kmDeviation < 0.7) engineBay += 6;
  if (input.condition === 'NEEDS_MAINTENANCE' || input.condition === 'تحتاج صيانة') engineBay -= 18;
  if (input.condition === 'NEEDS_INSPECTION' || input.condition === 'تحتاج فحص') engineBay -= 24;
  engineBay += highKm.penalty;
  if (descAnalysis.positiveSignals.some(s => s.includes('صيانة') || s.includes('ميكانيكي'))) engineBay += 4;
  if (descAnalysis.negativeSignals.some(s => s.includes('محرك') || s.includes('ميكانيكي'))) engineBay -= 5;
  engineBay = Math.max(0, Math.min(100, engineBay));

  let overall = Math.round(exterior * 0.32 + interior * 0.33 + engineBay * 0.35);
  if (sellerCondBase !== undefined) overall = Math.round((overall + sellerCondBase) / 2);
  if (input.isDamaged) overall -= 8;
  overall += descAnalysis.scoreAdjustment;
  overall = Math.max(0, Math.min(100, overall));

  const factors: ConditionFactor[] = [
    { name: 'الكيلومترات', score: Math.max(0, Math.min(100, Math.round(100 - (kmDeviation - 1) * 35))), description: `${input.kilometers.toLocaleString()} كم (${Math.round(kmPerYear).toLocaleString()} كم/سنة)` },
    { name: 'العمر', score: Math.max(0, Math.min(100, Math.round(100 - age * 4))), description: `${age} سنة من الاستخدام` },
  ];
  if (input.ownerCount === 1) factors.push({ name: 'مالك واحد', score: 95, description: 'مالك واحد سابق' });
  else if (input.ownerCount && input.ownerCount >= 2) factors.push({ name: 'عدد الملاك', score: Math.max(0, Math.min(100, 95 - (input.ownerCount - 1) * 15)), description: `${input.ownerCount} ملاك سابقين` });
  if (input.isPaintOriginal === true) factors.push({ name: 'الدهان الأصلي', score: 92, description: 'الدهان أصلي بالكامل' });
  else if (input.isPaintOriginal === false) factors.push({ name: 'الدهان غير أصلي', score: 62, description: 'الدهان غير أصلي' });
  if (input.hasServiceHistory) factors.push({ name: 'سجل صيانة كامل', score: 90, description: 'سجل صيانة كامل' });
  if (input.hasWarranty) factors.push({ name: 'ضمان ساري', score: 88, description: 'الضمان ساري المفعول' });
  if (highKm.penalty !== 0) factors.push({ name: 'كيلومترات مرتفعة', score: Math.max(0, Math.min(100, Math.round(50 + highKm.penalty))), description: highKm.label });

  const damages: DamageItem[] = [];
  if (input.isDamaged) damages.push({ part: 'عام', severity: 'moderate', description: 'سيارة مصدومة سابقاً' });
  if (input.isPaintOriginal === false) damages.push({ part: 'الطلاء', severity: 'minor', description: 'الدهان غير أصلي' });

  const summaryParts: string[] = [`الحالة العامة: ${scoreToLabel(overall)} (${overall}/100).`];
  summaryParts.push(`الدرجات الفرعية — الخارج: ${exterior}، الداخل: ${interior}، غرفة المحرك: ${engineBay}.`);
  if (input.hasServiceHistory) summaryParts.push('يوجد سجل صيانة كامل.');
  if (input.hasWarranty) summaryParts.push('السيارة تحت الضمان.');
  if (input.ownerCount === 1) summaryParts.push('مالك واحد سابق.');
  if (input.isDamaged) summaryParts.push('تنبيه: مصدومة سابقاً.');
  if (descAnalysis.positiveSignals.length > 0) summaryParts.push(`ملاحظات إيجابية: ${descAnalysis.positiveSignals.slice(0, 3).join('، ')}.`);
  if (descAnalysis.negativeSignals.length > 0) summaryParts.push(`تحذيرات: ${descAnalysis.negativeSignals.slice(0, 3).join('، ')}.`);

  return {
    score: overall, label: scoreToLabel(overall),
    exteriorScore: exterior, interiorScore: interior, engineBayScore: engineBay,
    factors, damages, summary: summaryParts.join(' '), isRealVision: false,
  };
}

export class ConditionScorer extends BaseAIModule<ConditionInput, ConditionOutput> {
  name = 'ConditionScorer';
  version = '4.0.0';
  provider: AIProviderType = 'local';

  async process(input: ConditionInput): Promise<AIResult<ConditionOutput>> {
    const startTime = Date.now();
    if (!this.validate(input)) {
      return { success: false, error: 'بيانات غير صالحة', processingTime: Date.now() - startTime };
    }

    // Try LLM first
    const llmResult = await analyzeConditionWithLLM(input);

    let data: ConditionOutput;
    if (llmResult) {
      data = {
        score: llmResult.score,
        label: llmResult.label,
        exteriorScore: llmResult.exteriorScore,
        interiorScore: llmResult.interiorScore,
        engineBayScore: llmResult.engineBayScore,
        factors: llmResult.factors,
        damages: llmResult.damages,
        summary: llmResult.summary + '\n(تم التحليل بالذكاء الاصطناعي)',
        isRealVision: false,
      };
    } else {
      // Fallback to local
      data = evaluateLocal(input);
    }

    const confidence = this.confidenceFromFields(
      [input.condition, input.ownerCount, input.isPaintOriginal, input.hasWarranty, input.hasServiceHistory, input.fuelType, input.description].filter(Boolean).length,
      7, 55, Math.min(15, input.images.length)
    );

    return {
      success: true, data, confidence, processingTime: Date.now() - startTime,
    };
  }
}

export const conditionScorer = new ConditionScorer({ type: 'local' });
