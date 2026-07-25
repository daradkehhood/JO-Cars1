/**
 * ConditionScorer — local, spec-based condition AI.
 *
 * No images? No problem. The engine reads the car's actual specifications
 * (km/year, seller-stated condition, owner count, paint originality,
 * warranty, service history, reported damages) and computes a structured
 * score with sub-scores per area (exterior, interior, engine). Every
 * conclusion is grounded in the seller's declared data — nothing is invented.
 *
 * This replaces the previous OpenAI Vision integration entirely.
 */

import { BaseAIModule, AIProviderType, AIResult } from './base';

export interface ConditionInput {
  images: string[];
  kilometers: number;
  year: number;
  transmission?: string;
  /** Seller-stated condition (EX/VG/G/FAIR/NEEDS_MAINTENANCE/NEEDS_INSPECTION). */
  condition?: string;
  description?: string;
  // ── Spec-driven extra fields (optionally passed by callers that have the Car record) ──
  ownerCount?: number;
  isDamaged?: boolean;
  isPaintOriginal?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  fuelType?: string;
  bodyType?: string;
}

export interface ConditionFactor {
  name: string;
  score: number; // 0-100
  description: string;
}

interface DamageItem {
  part: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

export interface ConditionOutput {
  score: number; // 0-100 overall
  label: string; // ممتازة / جيدة جداً / جيدة / مقبولة / تحتاج صيانة / سيئة
  exteriorScore: number;
  interiorScore: number;
  engineBayScore: number;
  factors: ConditionFactor[];
  damages: DamageItem[];
  summary: string;
  /** Always false in local mode (kept for UI compatibility). */
  isRealVision: boolean;
}

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

export class ConditionScorer extends BaseAIModule<ConditionInput, ConditionOutput> {
  name = 'ConditionScorer';
  version = '3.0.0';
  provider: AIProviderType = 'local';

  async process(input: ConditionInput): Promise<AIResult<ConditionOutput>> {
    const startTime = Date.now();
    if (!this.validate(input)) {
      return { success: false, error: 'بيانات غير صالحة', processingTime: Date.now() - startTime };
    }

    const data = this.evaluate(input);
    const confidence = this.confidenceFromFields(
      [input.condition, input.ownerCount, input.isPaintOriginal, input.hasWarranty, input.hasServiceHistory, input.fuelType].filter(Boolean).length,
      6,
      55,
      Math.min(15, input.images.length)
    );

    return {
      success: true,
      data,
      confidence,
      processingTime: Date.now() - startTime,
    };
  }

  private evaluate(input: ConditionInput): ConditionOutput {
    const age = Math.max(0, new Date().getFullYear() - input.year);
    const kmPerYear = age > 0 ? input.kilometers / age : input.kilometers;
    const kmDeviation = kmPerYear / EXPECTED_KM_PER_YEAR; // 1.0 == Jordan average

    // ── Sub-scores per area (each grounded in observable spec data) ──
    // Exterior —Proxy: paint originality + seller's stated mode of damage
    let exterior = 78;
    if (input.isPaintOriginal === true) exterior += 12;
    else if (input.isPaintOriginal === false) exterior -= 18;
    if (input.isDamaged) exterior -= 25;
    // Age naturally dulls even original paint
    exterior -= Math.min(15, age * 1.2);
    exterior = this.clamp(exterior, 0, 100);

    // Interior — proxy: km/year (more km = more use of seats/floor/wheel) + owner count
    let interior = 78;
    if (kmDeviation < 0.7) interior += 12;
    else if (kmDeviation < 1.0) interior += 6;
    else if (kmDeviation > 1.5) interior -= 15;
    else if (kmDeviation > 1.2) interior -= 8;
    if (input.ownerCount === 1) interior += 4;
    else if (input.ownerCount && input.ownerCount >= 3) interior -= 6;
    // Older cars naturally have more wear
    interior -= Math.min(12, age * 1);
    // Seller-declared interior reference (only condition maps onto the whole-car signal)
    const sellerCondBase = input.condition ? SELLER_CONDITION_BASE[input.condition] : undefined;
    if (sellerCondBase !== undefined) interior = Math.round((interior + sellerCondBase) / 2);
    interior = this.clamp(interior, 0, 100);

    // Engine bay — proxy: km/year (high km ⇒ more engine wear), service history, warranty
    let engineBay = 75;
    if (input.hasServiceHistory) engineBay += 14;
    if (input.hasWarranty) engineBay += 8;
    if (kmDeviation > 1.5) engineBay -= 20;
    else if (kmDeviation > 1.2) engineBay -= 10;
    else if (kmDeviation < 0.7) engineBay += 6;
    if (input.condition === 'NEEDS_MAINTENANCE' || input.condition === 'تحتاج صيانة') engineBay -= 18;
    if (input.condition === 'NEEDS_INSPECTION' || input.condition === 'تحتاج فحص') engineBay -= 24;
    engineBay = this.clamp(engineBay, 0, 100);

    // ── Overall score: weighted average emphasizing the seller's declaration
    // but settling toward the sub-scores when the engine bay is concerning.
    let overall = Math.round(exterior * 0.32 + interior * 0.33 + engineBay * 0.35);
    if (sellerCondBase !== undefined) overall = Math.round((overall + sellerCondBase) / 2);
    if (input.isDamaged) overall = overall - 8; // already in exterior; small reinforcement
    overall = this.clamp(overall, 0, 100);

    // ── Human-readable factors ──
    const factors: ConditionFactor[] = [
      {
        name: 'الكيلومترات',
        score: this.clamp(Math.round(100 - (kmDeviation - 1) * 35), 0, 100),
        description: `${input.kilometers.toLocaleString()} كم (${Math.round(kmPerYear).toLocaleString()} كم/سنة — ${kmDeviation < 0.8 ? 'أقل من المعدل' : kmDeviation > 1.2 ? 'أعلى من المعدل' : 'مطابق للمعدل'})`,
      },
      {
        name: 'العمر',
        score: this.clamp(Math.round(100 - age * 4), 0, 100),
        description: `${age} سنة من الاستخدام`,
      },
    ];

    if (input.ownerCount === 1) {
      factors.push({ name: 'مالك واحد', score: 95, description: 'مالك واحد سابق — علامة جودة قوية' });
    } else if (input.ownerCount && input.ownerCount >= 2) {
      factors.push({
        name: 'عدد الملاك',
        score: this.clamp(95 - (input.ownerCount - 1) * 15, 0, 100),
        description: `${input.ownerCount} ملاك سابقين — ${input.ownerCount >= 4 ? 'يقلل الثقة' : 'مقبول土豪'}`.replace('土豪', ''),
      });
    }

    if (input.isPaintOriginal === true) {
      factors.push({ name: 'الدهان الأصلي', score: 92, description: 'الدهان أصلي بالكامل — دلالة على سيارة غير متعرضة لحوادث' });
    } else if (input.isPaintOriginal === false) {
      factors.push({ name: 'الدهان غير أصلي', score: 62, description: 'الدهان غير أصلي — قد يدل على إعادة دهان أو إصلاح بسيط' });
    }

    if (input.hasServiceHistory) {
      factors.push({ name: 'سجل صيانة كامل', score: 90, description: 'وجود سجل صيانة كامل — يدل على عناية سابقة بالمحرك' });
    }

    if (input.hasWarranty) {
      factors.push({ name: 'ضمان ساري', score: 88, description: 'الضمان ساري المفعول — حماية إضافية للمشتري' });
    }

    // ── Damages surfaced from declared data (no image inspection) ──
    const damages: DamageItem[] = [];
    if (input.isDamaged) {
      damages.push({
        part: 'عام',
        severity: 'moderate',
        description: 'سيارة مصدومة سابقاً (وفق تصريح البائع) — تقلل من القيمة ودرجة الحالة',
      });
    }
    if (input.isPaintOriginal === false) {
      damages.push({
        part: 'الطلاء',
        severity: 'minor',
        description: 'الدهان غير أصلي (وفق تصريح البائع)',
      });
    }

    // ── Summary ──
    const summaryParts: string[] = [];
    summaryParts.push(`الحالة العامة: ${scoreToLabel(overall)} (${overall}/100).`);
    summaryParts.push(`الدرجات الفرعية — الخارج: ${exterior}، الداخل: ${interior}، غرفة المحرك: ${engineBay}.`);
    if (input.hasServiceHistory) summaryParts.push('يوجد سجل صيانة كامل (ميزة قوية).');
    if (input.hasWarranty) summaryParts.push('السيارة لا تزال تحت الضمان.');
    if (input.ownerCount === 1) summaryParts.push('مالك واحد سابق (أفضل سيناريو للحالة).');
    if (input.isDamaged) summaryParts.push('تنبيه: السيارة مصدومة سابقاً.');
    if (input.isPaintOriginal === false) summaryParts.push('تنبيه: الدهان غير أصلي.');
    summaryParts.push('هذا التقييم مبني على المواصفات المُدخل ة من البائع (لم يتم تحليل الصور — متاح عند الحاجة عبر وحدة كشف الأضرار).');

    return {
      score: overall,
      label: scoreToLabel(overall),
      exteriorScore: exterior,
      interiorScore: interior,
      engineBayScore: engineBay,
      factors,
      damages,
      summary: summaryParts.join(' '),
      isRealVision: false,
    };
  }
}

export const conditionScorer = new ConditionScorer({ type: 'local' });
