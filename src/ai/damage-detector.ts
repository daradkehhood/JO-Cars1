/**
 * DamageDetector — local rule-based detector.
 *
 * No vision. The detector is fed the seller's declared damage flags plus the
 * ConditionScorer output and surfaces a concise damage list. Only declared
 * damages are reported — we never invent damages a seller didn't disclose.
 */

import { BaseAIModule, AIProviderType, AIResult } from './base';
import { conditionScorer, ConditionOutput } from './condition-scorer';

export interface DamageInput {
  images: string[];
  year: number;
  kilometers: number;
  isDamaged?: boolean;
  isPaintOriginal?: boolean;
  condition?: string;
  ownerCount?: number;
  hasServiceHistory?: boolean;
  hasWarranty?: boolean;
}

export interface DamageItem {
  part: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

export interface DamageOutput {
  damages: DamageItem[];
  overallScore: number;
  summary: string;
  /** Always false in local mode (kept for UI compatibility). */
  isRealVision: boolean;
}

export class DamageDetector extends BaseAIModule<DamageInput, DamageOutput> {
  name = 'DamageDetector';
  version = '3.0.0';
  provider: AIProviderType = 'local';

  async process(input: DamageInput): Promise<AIResult<DamageOutput>> {
    const startTime = Date.now();

    // Delegate scoring to ConditionScorer for the holistic score.
    const condResult = await conditionScorer.process({
      images: input.images || [],
      kilometers: input.kilometers,
      year: input.year,
      condition: input.condition,
      ownerCount: input.ownerCount,
      isDamaged: input.isDamaged,
      isPaintOriginal: input.isPaintOriginal,
      hasServiceHistory: input.hasServiceHistory,
      hasWarranty: input.hasWarranty,
    });

    const cond = condResult.data as ConditionOutput | undefined;
    const damages: DamageItem[] = [];

    // Surface declared damages (the only ones we can responsibly report without vision)
    if (input.isDamaged) {
      damages.push({
        part: 'عام',
        severity: 'moderate',
        description: 'سيارة مصدومة سابقاً (وفق تصريح البائع) — يُنصح بمعاينة هيكل السيارة قبل الشراء',
      });
    }
    if (input.isPaintOriginal === false) {
      damages.push({
        part: 'الطلاء',
        severity: 'minor',
        description: 'الدهان غير أصلي (وفق تصريح البائع) — قد يشير إلى إعادة دهان بعد إصلاح',
      });
    }
    // If ConditionScorer surfaced further inferred damages (e.g. high km engine wear),
    // include those it flagged too — but only as descriptive items, not new claims.
    if (cond && Array.isArray(cond.damages)) {
      for (const d of cond.damages) {
        if (!damages.some((x) => x.part === d.part)) damages.push(d);
      }
    }

    const score = cond?.score ?? (input.isDamaged ? 75 : 100);

    let summary: string;
    if (damages.length === 0) {
      summary = 'لا توجد أضرار مذكورة من البائع. بناءً على المواصفات المدخلة، الحالة العامة ' +
        (cond?.label || 'جيدة') + ` (${score}/100).`;
    } else {
      summary = `تم رصد ${damages.length} بند: ${damages.map((d) => d.part).join('، ')}. ` +
        `الحالة العامة المقدرة ${cond?.label || 'جيدة'} (${score}/100). ` +
        'البيانات مبنية على تصريح البائع — يُوصى بأخذ مواصفات سيارة محترف قبل الشراء.';
    }

    return {
      success: true,
      data: {
        damages,
        overallScore: score,
        summary,
        isRealVision: false,
      },
      processingTime: Date.now() - startTime,
    };
  }
}

export const damageDetector = new DamageDetector({ type: 'local' });
