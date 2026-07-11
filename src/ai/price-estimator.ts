import { BaseAIModule, AIProviderType } from './base';

interface PriceInput {
  brand: string;
  model: string;
  year: number;
  kilometers: number;
  condition: string;
  city: string;
  fuelType?: string;
  transmission?: string;
  engineCapacity?: number;
}

interface PriceOutput {
  minPrice: number;
  fairPrice: number;
  maxPrice: number;
  confidence: number;
  reasoning: string;
  marketFactors: string[];
}

export class PriceEstimator extends BaseAIModule<PriceInput, PriceOutput> {
  name = 'PriceEstimator';
  version = '1.0.0';
  provider: AIProviderType = 'openai';

  async process(input: PriceInput): Promise<import('./base').AIResult<PriceOutput>> {
    const startTime = Date.now();

    if (!this.validate(input)) {
      return { success: false, error: 'Invalid input', processingTime: Date.now() - startTime };
    }

    const prompt = `
      أنا بحاجة لتقدير سعر سيارة في الأردن بالدينار الأردني.
      بيانات السيارة:
      - الشركة: ${input.brand}
      - الموديل: ${input.model}
      - سنة الصنع: ${input.year}
      - الكيلومترات: ${input.kilometers.toLocaleString()} كم
      - الحالة: ${input.condition}
      - المحافظة: ${input.city}
      - نوع الوقود: ${input.fuelType || 'غير محدد'}
      - ناقل الحركة: ${input.transmission || 'غير محدد'}
      - سعة المحرك: ${input.engineCapacity || 'غير محدد'}

      قم بتحليل بيانات السيارة بناءً على سوق السيارات الأردني الحالي وأسعار السوق.
      
      أعد النتيجة بصيغة JSON فقط:
      {
        "minPrice": أقل سعر مناسب,
        "fairPrice": السعر العادل,
        "maxPrice": أعلى سعر منطقي,
        "confidence": نسبة الثقة (0-100),
        "reasoning": "شرح التقدير",
        "marketFactors": ["عامل1", "عامل2"]
      }
    `;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSON<PriceOutput>(response);

    if (parsed) {
      return {
        success: true,
        data: parsed,
        confidence: parsed.confidence,
        processingTime: Date.now() - startTime,
      };
    }

    // Fallback estimation logic
    const basePrice = this.estimateBasePrice(input.brand, input.model, input.year);
    const kmDeduction = Math.min(input.kilometers * 0.05, basePrice * 0.3);
    const estimatedPrice = Math.max(basePrice - kmDeduction, 500);

    return {
      success: true,
      data: {
        minPrice: Math.round(estimatedPrice * 0.9),
        fairPrice: Math.round(estimatedPrice),
        maxPrice: Math.round(estimatedPrice * 1.1),
        confidence: 60,
        reasoning: 'تقدير مبدئي بناءً على بيانات السوق العامة. للحصول على تقدير أدق، يرجى توفير صور للسيارة.',
        marketFactors: ['تقدير تلقائي', 'حسب الكيلومترات', 'حسب سنة الصنع'],
      },
      processingTime: Date.now() - startTime,
    };
  }

  private estimateBasePrice(brand: string, model: string, year: number): number {
    const age = new Date().getFullYear() - year;
    const depreciationRate = Math.min(age * 0.08, 0.7);
    const basePrices: Record<string, number> = {
      'تويوتا': 25000, 'هيونداي': 18000, 'كيا': 17000, 'نيسان': 22000,
      'مرسيدس': 45000, 'بي إم دبليو': 40000, 'هوندا': 20000, 'ميتسوبيشي': 16000,
      'شيفروليه': 18000, 'فورد': 20000, 'لكزس': 35000, 'مازدا': 19000,
      'فولكسفاجن': 20000, 'أودي': 35000, 'بورش': 60000, 'جيب': 25000,
    };
    const base = basePrices[brand] || 20000;
    return Math.round(base * (1 - depreciationRate));
  }
}

export const priceEstimator = new PriceEstimator({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o',
});
