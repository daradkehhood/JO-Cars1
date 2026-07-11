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
}

export class DescriptionGenerator extends BaseAIModule<DescriptionInput, { description: string; tags: string[] }> {
  name = 'DescriptionGenerator';
  version = '2.0.0';
  provider: AIProviderType = 'openai';

  async process(input: DescriptionInput) {
    const startTime = Date.now();

    const prompt = `
      أنت خبير في كتابة إعلانات السيارات في الأردن. اكتب وصفاً احترافياً مقنعاً لسيارة للبيع.

      بيانات السيارة:
      - الموديل: ${input.brand} ${input.model} ${input.year}
      - كيلومتر: ${input.kilometers.toLocaleString()} كم
      - نوع الوقود: ${input.fuelType}
      - القير: ${input.transmission}
      - اللون: ${input.color}
      - الحالة: ${input.condition}
      - السعر: ${input.price.toLocaleString()} دينار أردني
      ${input.features.length ? `- المميزات: ${input.features.join(', ')}` : ''}
      ${input.currentDescription ? `- ملاحظات البائع: ${input.currentDescription}` : ''}

      اكتب وصفاً تسويقياً احترافياً (لا يقل عن 100 كلمة) بالعربية الفصحى مع لغة سوقية جذابة.
      ركز على نقاط القوة، اذكر حالة السيارة، وسبب كونها صفقة جيدة.
      أعد النتيجة بصيغة JSON التالية تماماً:
      {
        "description": "الوصف الكامل",
        "tags": ["وسم1", "وسم2", "وسم3", "وسم4", "وسم5"]
      }
    `;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSON<{ description: string; tags: string[] }>(response);

    if (parsed && parsed.description && parsed.description.length > 50) {
      return { success: true, data: parsed, processingTime: Date.now() - startTime };
    }

    const fallbackDesc = `
      ${input.brand} ${input.model} ${input.year} بحالة ممتازة للبيع في الأردن.
      السيارة ذات لون ${input.color}، تعمل بوقود ${input.fuelType}،
      قير ${input.transmission}، عدد الكيلومترات ${input.kilometers.toLocaleString()} كم فقط.
      السعر: ${input.price.toLocaleString()} دينار أردني شامل كافة الرسوم.
      السيارة بحالة ${input.condition} وجاهزة للتسليم الفوري.
      للاستفسار والمعاينة يرجى الاتصال على الرقم المرفق.
    `.trim();

    return {
      success: true,
      data: { description: fallbackDesc, tags: [input.brand, input.model, String(input.year), input.fuelType, input.condition] },
      processingTime: Date.now() - startTime,
    };
  }
}

export const descriptionGenerator = new DescriptionGenerator({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o',
});
