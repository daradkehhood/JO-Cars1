import { BaseAIModule } from './base';

interface SpecInput { images: string[]; description?: string }
interface SpecOutput { brand?: string; model?: string; year?: number; color?: string; bodyType?: string; confidence: number }

export class SpecExtractor extends BaseAIModule<SpecInput, SpecOutput> {
  name = 'SpecExtractor';
  version = '1.0.0';
  provider: any = 'custom';

  async process(input: SpecInput) {
    const startTime = Date.now();
    return {
      success: true,
      data: {
        confidence: 0,
      },
      processingTime: Date.now() - startTime,
    };
  }
}

export const specExtractor = new SpecExtractor({
  type: 'custom', apiKey: '', model: 'custom'
});
