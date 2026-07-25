/**
 * ConditionScorer — realistic condition evaluation using OpenAI Vision.
 *
 * The model inspects the car's images (exterior, interior, engine bay,
 * dashboard, tires) and returns a structured JSON assessment. Falls back
 * to a km/age heuristic when OpenAI is unavailable or no images exist.
 */

import { BaseAIModule, AIProviderType, AIResult } from './base';

export interface ConditionInput {
  images: string[];
  kilometers: number;
  year: number;
  transmission?: string;
  condition?: string; // Seller-stated condition (used as a tie-breaker)
  description?: string;
}

export interface ConditionFactor {
  name: string;
  score: number; // 0-100
  description: string;
}

export interface ConditionOutput {
  score: number; // 0-100 overall
  label: string; // ممتازة / جيدة جداً / جيدة / مقبولة / تحتاج صيانة / سيئة
  exteriorScore: number;
  interiorScore: number;
  engineBayScore: number;
  factors: ConditionFactor[];
  damages: Array<{ part: string; severity: 'minor' | 'moderate' | 'severe'; description: string }>;
  summary: string;
  isRealVision: boolean;
}

export class ConditionScorer extends BaseAIModule<ConditionInput, ConditionOutput> {
  name = 'ConditionScorer';
  version = '2.0.0';
  provider: AIProviderType = 'openai';

  async process(input: ConditionInput): Promise<AIResult<ConditionOutput>> {
    const startTime = Date.now();

    // Try AI vision first if we have images and a key
    if (this.isAIReady() && input.images && input.images.length > 0) {
      const aiResult = await this.callAIWithVision(
        this.buildVisionPrompt(input),
        input.images.map((url) => ({ url, detail: 'low' as const })),
        'أنت خبير فني تقييم سيارات. تحلّل الصور بدقة وتذكر العيوب الفعلية فقط. لا تخمن. أعد JSON عربي فقط.',
        { temperature: 0.2, maxTokens: 1500, jsonMode: true }
      );

      if (aiResult) {
        const parsed = this.parseJSON<any>(aiResult);
        if (parsed) {
          const score = this.clamp(Math.round(Number(parsed.overallScore) || 0), 0, 100);
          const ext = this.clamp(Math.round(Number(parsed.exteriorScore) || 0), 0, 100);
          const int = this.clamp(Math.round(Number(parsed.interiorScore) || 0), 0, 100);
          const eng = this.clamp(Math.round(Number(parsed.engineBayScore) || 0), 0, 100);
          const factors: ConditionFactor[] = Array.isArray(parsed.factors)
            ? parsed.factors.slice(0, 6).map((f: any) => ({
                name: String(f.name || '').slice(0, 100),
                score: this.clamp(Math.round(Number(f.score) || 0), 0, 100),
                description: String(f.description || '').slice(0, 300),
              }))
            : [];
          const damages = Array.isArray(parsed.damageItems)
            ? parsed.damageItems.slice(0, 12).map((d: any) => ({
                part: String(d.part || d.name || '').slice(0, 100),
                severity:
                  d.severity === 'minor' || d.severity === 'moderate' || d.severity === 'severe'
                    ? d.severity
                    : 'minor',
                description: String(d.description || '').slice(0, 300),
              }))
            : [];
          return {
            success: true,
            data: {
              score,
              label: this.scoreToLabel(score),
              exteriorScore: ext,
              interiorScore: int,
              engineBayScore: eng,
              factors,
              damages,
              summary: String(parsed.reasoning || parsed.summary || this.scoreToLabel(score)).slice(0, 1000),
              isRealVision: true,
            },
            confidence: Math.min(95, 60 + Math.floor(score / 5)),
            processingTime: Date.now() - startTime,
          };
        }
      }
    }

    // Fallback heuristic (no images or AI unavailable)
    return {
      success: true,
      data: this.heuristic(input),
      processingTime: Date.now() - startTime,
    };
  }

  private buildVisionPrompt(input: ConditionInput): string {
    return `حلل حالة هذه السيارة بناءً على الصور المرفقة فقط. السيارة لديها ${input.kilometers.toLocaleString()} كم، سنة ${input.year}.

أعد تقييمك بصيغة JSON فقط:
{
  "exteriorScore": 85,           // 0-100 حالة الطلاء والهيكل الخارجي
  "interiorScore": 80,           // 0-100 حالة الداخل والمقاعد والتابلوه
  "engineBayScore": 90,          // 0-100 حالة حجرة المحرك
  "overallScore": 82,            // 0-100 التقييم العام
  "factors": [
    { "name": "الطلاء", "score": 80, "description": "وصف جميع الخدوش/الانبعاجات/أماكن الدهان" }
  ],
  "damageItems": [
    { "part": "الباب الأمامي الأيمن", "severity": "minor",
      "description": "خدش بسيط بطول 10 سم" }
  ],
  "reasoning": "شرح عام بشكل هرمي للحالة بناءً على ما تراه في الصور"
}

التعليمات:
- اذكر فقط العيوب التي تراها فعلاً في الصور.
- لا تخمن. إذا لم تتمكن من رؤية جزء محدد، اذكره كـ "factor" بقيمة منخفضة بدلاً من damageItem.
- severity يجب أن تكون minor/moderate/severe فقط.
- النصوص باللغة العربية.`;
  }

  private heuristic(input: ConditionInput): ConditionOutput {
    const age = Math.max(0, new Date().getFullYear() - input.year);
    const kmPerYear = age > 0 ? input.kilometers / age : 0;

    let score = 85;
    if (kmPerYear > 30000) score -= 15;
    else if (kmPerYear > 20000) score -= 10;
    else if (kmPerYear < 10000) score += 5;

    // Adjust for seller-stated condition if present
    const condMap: Record<string, number> = {
      EXCELLENT: 5, VERY_GOOD: 2, GOOD: 0, FAIR: -10,
      NEEDS_MAINTENANCE: -20, NEEDS_INSPECTION: -25,
      'ممتازة': 5, 'جيدة جداً': 2, 'جيدة': 0, 'مقبولة': -10,
    };
    if (input.condition && condMap[input.condition] !== undefined) {
      score += condMap[input.condition];
    }
    score = this.clamp(score, 0, 100);

    const factors: ConditionFactor[] = [
      {
        name: 'الكيلومترات',
        score: this.clamp(Math.round(100 - (kmPerYear / 300) * 10), 0, 100),
        description: `${input.kilometers.toLocaleString()} كم (${Math.round(kmPerYear).toLocaleString()} كم/سنة)`,
      },
      {
        name: 'العمر',
        score: this.clamp(Math.round(100 - age * 5), 0, 100),
        description: `${age} سنوات`,
      },
    ];

    return {
      score,
      label: this.scoreToLabel(score),
      exteriorScore: score,
      interiorScore: score,
      engineBayScore: score,
      factors,
      damages: [],
      summary: `تقييم تقديري (بدون تحليل صور): الحالة العامة ${this.scoreToLabel(score)} (${score}/100). لتحليل أدق بالاعتماد على الصور،яхен فعل OpenAI Vision.`,
      isRealVision: false,
    };
  }

  private scoreToLabel(score: number): string {
    if (score >= 90) return 'ممتازة';
    if (score >= 80) return 'جيدة جداً';
    if (score >= 65) return 'جيدة';
    if (score >= 45) return 'مقبولة';
    if (score >= 25) return 'تحتاج صيانة';
    return 'سيئة';
  }

  private clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }
}

export const conditionScorer = new ConditionScorer({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
});
