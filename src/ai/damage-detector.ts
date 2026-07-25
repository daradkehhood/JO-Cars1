/**
 * DamageDetector — realistic damage detection via OpenAI Vision.
 *
 * Thin wrapper over ConditionScorer that surfaces just the damage list
 * for the "Damages" card on the car detail page.
 */

import { BaseAIModule, AIProviderType, AIResult } from './base';
import { conditionScorer, ConditionOutput } from './condition-scorer';

export interface DamageInput {
  images: string[];
  year: number;
  kilometers: number;
  isDamaged?: boolean;
  isPaintOriginal?: boolean;
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
  isRealVision: boolean;
}

export class DamageDetector extends BaseAIModule<DamageInput, DamageOutput> {
  name = 'DamageDetector';
  version = '2.0.0';
  provider: AIProviderType = 'openai';

  async process(input: DamageInput): Promise<AIResult<DamageOutput>> {
    const startTime = Date.now();

    // Re-use ConditionScorer for matching damage entries (no need to call AI twice)
    const condResult = await conditionScorer.process({
      images: input.images || [],
      kilometers: input.kilometers,
      year: input.year,
      condition: input.isDamaged ? 'FAIR' : undefined,
    });

    const cond = condResult.data as ConditionOutput | undefined;
    let damages: DamageItem[] = [];
    let summary = 'لا توجد أضرار ظاهرة في الصور.';
    let score = 100;

    if (cond && cond.isRealVision) {
      damages = cond.damages;
      score = cond.score;
      summary = damages.length === 0
        ? 'لم يتم رصد أي خدوش أو انبعاجات واضحة من تحليل الصور.'
        : `رصد ${damages.length} عيب: ${damages.map((d) => d.part).join('، ')}`;
    } else {
      // Heuristic fallback — only surface seller-declared damages
      if (input.isDamaged) {
        damages.push({
          part: 'عام',
          severity: 'moderate',
          description: 'سيارة مصدومة سابقاً (وفق تصريح البائع)',
        });
        summary = 'السيارة مصدومة سابقاً وفق تصريح البائع (لم يتم تحليل صور).';
        score = 75;
      }
      if (input.isPaintOriginal === false) {
        damages.push({
          part: 'الطلاء',
          severity: 'minor',
          description: 'الدهان غير أصلي (وفق تصريح البائع)',
        });
        score = Math.min(score, 90);
      }
    }

    return {
      success: true,
      data: {
        damages,
        overallScore: score,
        summary,
        isRealVision: cond?.isRealVision || false,
      },
      processingTime: Date.now() - startTime,
    };
  }
}

export const damageDetector = new DamageDetector({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
});
