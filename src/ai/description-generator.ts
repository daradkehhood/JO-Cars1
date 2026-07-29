/**
 * DescriptionGenerator v4.0.0 — NVIDIA AI-powered Arabic car description generator.
 *
 * Architecture:
 *  1. PRIMARY: NVIDIA LLM generates a natural, attractive Arabic description.
 *  2. FALLBACK: Template-based generation if LLM fails.
 */
import OpenAI from 'openai';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'z-ai/glm-5.2';
import { BaseAIModule, AIProviderType } from './base';
import { chatCompletionJSON, type ChatMessage } from './nvidia-client';
import { getSystemPrompt } from './site-knowledge';

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

interface LLMDescriptionResult {
  description: string;
  tags: string[];
}

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: 'ممتازة', VERY_GOOD: 'جيدة جداً', GOOD: 'جيدة',
  FAIR: 'مقبولة', NEEDS_MAINTENANCE: 'تحتاج صيانة', NEEDS_INSPECTION: 'تحتاج فحص',
  'ممتازة': 'ممتازة', 'جيدة جداً': 'جيدة جداً', 'جيدة': 'جيدة', 'مقبولة': 'مقبولة',
};

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هايبرد', ELECTRIC: 'كهرباء', PLUGIN_HYBRID: 'هايبرد بلج إن',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIC: 'أوتوماتيك', MANUAL: 'يدوي', CVT: 'CVT', DCT: 'DCT', SEMI_AUTOMATIC: 'نصف أوتوماتيك',
};

const CONDITION_SALES_PITCH: Record<string, string> = {
  'ممتازة': 'بحالة الوكالة — وكأنها جديدة',
  'جيدة جداً': 'في حالة ممتازة جداً ولا يوجد فيها أي مشاكل',
  'جيدة': 'بحالة جيدة جداً وجاهزة للقيادة فوراً',
  'مقبولة': 'في حالة مقبولة — تحتاج بعض الاهتمام البسيط',
  'تحتاج صيانة': 'تحتاج إلى بعض الصيانة البسيطة',
  'تحتاج فحص': 'تحتاج فحص فني قبل الشراء',
};

// ── LLM-based description generation ──
async function generateDescriptionWithLLM(input: DescriptionInput): Promise<LLMDescriptionResult | null> {
  try {
    const systemPrompt = getSystemPrompt('description');

    const userMessage = `اكتب وصفاً جذاباً ومحترفاً لهذه السيارة:

المواصفات:
- الماركة: ${input.brand}
- الموديل: ${input.model}
- السنة: ${input.year}
- الكيلومترات: ${input.kilometers.toLocaleString()} كم
- نوع الوقود: ${input.fuelType}
- ناقل الحركة: ${input.transmission}
- اللون: ${input.color}
- الحالة: ${input.condition}
- السعر: ${input.price.toLocaleString()} د.أ
- نوع الهيكل: ${input.bodyType || 'غير محدد'}
- سعة المحرك: ${input.engineCapacity || 'غير محدد'}
- عدد الملاك: ${input.ownerCount || 1}
- ضمان: ${input.hasWarranty ? 'نعم' : 'لا'}
- سجل صيانة: ${input.hasServiceHistory ? 'نعم' : 'لا'}
- قابل للتفاوض: ${input.isNegotiable ? 'نعم' : 'لا'}
${input.features.length > 0 ? `- المميزات: ${input.features.join('، ')}` : ''}
${input.currentDescription ? `- ملاحظات البائع: ${input.currentDescription}` : ''}

اكتب وصفاً جذاباً بالعربية الفصحى المبسطة. اذكر الميزات الرئيسية. لا تبالغ. اختم بدعوة للتواصل.

أجب بالـ JSON فقط:
{
  "description": "<الوصف الكامل>",
  "tags": ["<وسم 1>", "<وسم 2>", ...]
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const result = await chatCompletionJSON<LLMDescriptionResult>(messages, {
      temperature: 0.7,
      maxTokens: 1500,
    });

    if (result && result.description && result.description.length > 50) {
      result.tags = result.tags || [];
      return result;
    }
    return null;
  } catch (error) {
    console.error('[DescriptionGenerator LLM] Error:', error);
    return null;
  }
}

// ── Template-based fallback ──
function generateTemplate(input: DescriptionInput): { description: string; tags: string[] } {
  const conditionLabel = (input.condition && CONDITION_LABELS[input.condition]) || input.condition || 'جيدة';
  const fuelLabel = (input.fuelType && FUEL_LABELS[input.fuelType]) || input.fuelType || 'بنزين';
  const transLabel = (input.transmission && TRANSMISSION_LABELS[input.transmission]) || input.transmission || 'أوتوماتيك';
  const pitch = CONDITION_SALES_PITCH[conditionLabel] || `بحالة ${conditionLabel}`;

  const ownersText = input.ownerCount === 1 ? 'مالك واحد فقط' : input.ownerCount ? `${input.ownerCount} ملاك سابقين` : '';
  const warrantyText = input.hasWarranty ? 'السيارة لا تزال تحت الضمان الوكيل.' : '';
  const serviceText = input.hasServiceHistory ? 'يوجد سجل صيانة كامل لدى الوكيل.' : '';
  const negotiationText = input.isNegotiable ? 'السعر قابل للتفاوض البسيط للجادين.' : 'السعر ثابت.';
  const featuresText = input.features?.length > 0 ? `تأتي هذه السيارة مزوّدة بمميزات بارزة: ${input.features.join('، ')}.` : '';
  const sellerNotes = input.currentDescription ? `ملاحظات البائع: ${input.currentDescription.trim()}` : '';

  const parts: string[] = [];
  parts.push(`للبيع ${input.brand} ${input.model} ${input.year} ${pitch}.`);
  parts.push(`السيارة ${input.color || 'بلون أنيق'}, تعمل بوقود ${fuelLabel}، قير ${transLabel}${input.engineCapacity ? ` بسعة محرك ${input.engineCapacity}` : ''}.`);
  parts.push(`عدد الكيلومترات: ${input.kilometers.toLocaleString()} كم فقط.`);
  if (ownersText) parts.push(ownersText + '.');
  parts.push(`السعر: ${input.price.toLocaleString()} دينار أردني. ${negotiationText}`);
  if (warrantyText) parts.push(warrantyText);
  if (serviceText) parts.push(serviceText);
  if (featuresText) parts.push(featuresText);
  parts.push('السيارة جاهزة للتسليم الفوري ومعاينة فورية في الأردن.');
  if (sellerNotes) parts.push(sellerNotes);
  parts.push('للاستفسار والمعاينة يرجى التواصل عبر رقم الهاتف المرفق. الجادين فقط.');

  const tags = Array.from(new Set([
    input.brand, input.model, String(input.year), fuelLabel, transLabel, conditionLabel,
    ...(input.bodyType ? [input.bodyType] : []), ...(input.color ? [input.color] : []),
    ...(input.hasWarranty ? ['ضمان'] : []), ...(input.hasServiceHistory ? ['صيانة'] : []),
  ].filter(Boolean)));

  return { description: parts.join(' '), tags };
}

export class DescriptionGenerator extends BaseAIModule<DescriptionInput, { description: string; tags: string[] }> {
  name = 'DescriptionGenerator';
  version = '4.0.0';
  provider: AIProviderType = 'local';

  async process(input: DescriptionInput) {
    const startTime = Date.now();

    // Try LLM first
    const llmResult = await generateDescriptionWithLLM(input);

    let result: { description: string; tags: string[] };
    if (llmResult) {
      result = llmResult;
    } else {
      result = generateTemplate(input);
    }

    return {
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
    };
  }
}

export const descriptionGenerator = new DescriptionGenerator({ type: 'local' });
