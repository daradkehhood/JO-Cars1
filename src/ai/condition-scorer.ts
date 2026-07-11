import { BaseAIModule } from './base';

interface ConditionInput { 
  images: string[]; 
  kilometers: number;
  year: number;
  transmission: string;
  description: string;
}
interface ConditionOutput { score: number; label: string; factors: any[]; summary: string }

export class ConditionScorer extends BaseAIModule<ConditionInput, ConditionOutput> {
  name = 'ConditionScorer';
  version = '1.0.0';
  provider: any = 'custom';

  async process(input: ConditionInput) {
    const startTime = Date.now();
    
    const age = new Date().getFullYear() - input.year;
    const kmPerYear = age > 0 ? input.kilometers / age : 0;
    
    let score = 85;
    if (kmPerYear > 30000) score -= 15;
    else if (kmPerYear > 20000) score -= 10;
    else if (kmPerYear < 10000) score += 5;
    
    const labels = ['ممتازة', 'ممتازة جداً', 'جيدة جداً', 'جيدة', 'مقبولة', 'تحتاج صيانة'];
    const label = labels[Math.min(Math.floor((100 - score) / 15), labels.length - 1)];
    
    return {
      success: true,
      data: {
        score,
        label,
        factors: [
          { name: 'الكيلومترات', score: Math.max(0, 100 - (kmPerYear / 300) * 10), description: `${input.kilometers.toLocaleString()} كم` },
          { name: 'العمر', score: Math.max(0, 100 - age * 5), description: `${age} سنوات` },
        ],
        summary: `تقييم الحالة العامة: ${label} (${score}/100)`,
      },
      processingTime: Date.now() - startTime,
    };
  }
}

export const conditionScorer = new ConditionScorer({
  type: 'custom', apiKey: '', model: 'custom'
});
