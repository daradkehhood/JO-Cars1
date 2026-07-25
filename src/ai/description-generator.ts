/**
 * DescriptionGenerator — pure template-based Arabic car description generator.
 *
 * Combines the seller's own notes with a structured Arabic marketing template
 * tailored to the Jordanian market. No external AI is used; every output is
 * deterministic and reflects only the inputs the seller provided.
 */

import { BaseAIModule, AIProviderType } from './base';

interface DescriptionInput {
  brand: string;
  model: string;
  year: number;
  kilometers: number;
  fuelType: string;
  transmission: string;
  color: string;
  condition: string;
  price: number;
  features: string[];
  currentDescription?: string;
  bodyType?: string;
  engineCapacity?: number | string;
  ownerCount?: number;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isNegotiable?: boolean;
}

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: 'ممتازة', VERY_GOOD: 'جيدة جداً', GOOD: 'جيدة',
  FAIR: 'مقبولة', NEEDS_MAINTENANCE: 'تحتاج صيانة', NEEDS_INSPECTION: 'تحتاج فحص',
  'ممتازة': 'ممتازة', 'جيدة جداً': 'جيدة جداً', 'جيدة': 'جيدة', 'مقبولة': 'مقبولة',
};

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هايبرد',
  ELECTRIC: 'كهرباء', PLUGIN_HYBRID: 'هايبرد بلج إن',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIC: 'أوتوماتيك', MANUAL: 'يدوي', CVT: 'CVT',
  DCT: 'DCT', SEMI_AUTOMATIC: 'نصف أوتوماتيك',
};

const CONDITION_SALES_PITCH: Record<string, string> = {
  'ممتازة': 'بحالة الوكالة — وكأنها جديدة',
  'جيدة جداً': 'في حالة ممتازة جداً ولا يوجد فيها أي مشاكل',
  'جيدة': 'بحالة جيدة جداً وجاهزة للقيادة فوراً',
  'مقبولة': 'في حالة مقبولة — تحتاج بعض الاهتمام البسيط',
  'تحتاج صيانة': 'تحتاج إلى بعض الصيانة البسيطة وفحصها قبل الشراء',
  'تحتاج فحص': 'تحتاج فحص فني قبل الشراء',
};

export class DescriptionGenerator extends BaseAIModule<DescriptionInput, { description: string; tags: string[] }> {
  name = 'DescriptionGenerator';
  version = '3.0.0';
  provider: AIProviderType = 'local';

  async process(input: DescriptionInput) {
    const startTime = Date.now();

    const conditionLabel = (input.condition && CONDITION_LABELS[input.condition]) || input.condition || 'جيدة';
    const fuelLabel = (input.fuelType && FUEL_LABELS[input.fuelType]) || input.fuelType || 'بنزين';
    const transLabel = (input.transmission && TRANSMISSION_LABELS[input.transmission]) || input.transmission || 'أوتوماتيك';
    const pitch = CONDITION_SALES_PITCH[conditionLabel] || `بحالة ${conditionLabel}`;

    const ownersText = input.ownerCount === 1
      ? 'مالك واحد فقط'
      : input.ownerCount === 2
        ? 'مالكان فقط'
        : input.ownerCount
          ? `${input.ownerCount} ملاك سابقين`
          : '';

    const warrantyText = input.hasWarranty ? 'السيارة لا تزال تحت الضمان الوكيل.' : '';
    const serviceText = input.hasServiceHistory ? 'يوجد سجل صيانة كامل لدى الوكيل.' : '';
    const negotiationText = input.isNegotiable
      ? 'السعر قابل للتفاوض البسيط للجادين.'
      : 'السعر ثابت وغير قابل للتفاوض.';

    const featuresText = input.features && input.features.length > 0
      ? `تأتي هذه السيارة مزوّدة بمميزات بارزة: ${input.features.join('، ')}.`
      : '';

    const sellerNotes = input.currentDescription ? `ملاحظات البائع: ${input.currentDescription.trim()}` : '';

    const descriptionParts: string[] = [];
    descriptionParts.push(`للبيع ${input.brand} ${input.model} ${input.year} ${pitch}.`);
    descriptionParts.push(
      `السيارة ${input.color || 'بلون أنيق'}, تعمل بوقود ${fuelLabel}، قير ${transLabel}` +
      (input.engineCapacity ? ` بسعة محرك ${input.engineCapacity}` : '') + '.'
    );
    descriptionParts.push(`عدد الكيلومترات: ${input.kilometers.toLocaleString()} كم فقط.`);
    if (ownersText) descriptionParts.push(ownersText + '.');
    descriptionParts.push(`السعر: ${input.price.toLocaleString()} دينار أردني. ${negotiationText}`);
    if (warrantyText) descriptionParts.push(warrantyText);
    if (serviceText) descriptionParts.push(serviceText);
    if (featuresText) descriptionParts.push(featuresText);
    descriptionParts.push('السيارة جاهزة للتسليم الفوري ومعاينة فورية في الأردن.');
    if (sellerNotes) descriptionParts.push(sellerNotes);
    descriptionParts.push('للاستفسار والمعاينة يرجى التواصل عبر رقم الهاتف المرفق. الجادين فقط.');

    const description = descriptionParts.join(' ');

    // Build tags — keep brand/model/year + any distinguishing specs (deduped)
    const tags = Array.from(new Set([
      input.brand,
      input.model,
      String(input.year),
      fuelLabel,
      transLabel,
      conditionLabel,
      ...(input.bodyType ? [input.bodyType] : []),
      ...(input.color ? [input.color] : []),
      ...(input.hasWarranty ? ['ضمان'] : []),
      ...(input.hasServiceHistory ? ['سجل صيانة'] : []),
    ].filter(Boolean))) as string[];

    return {
      success: true,
      data: { description, tags },
      processingTime: Date.now() - startTime,
    };
  }
}

export const descriptionGenerator = new DescriptionGenerator({ type: 'local' });
