import { BaseAIModule, AIProviderType } from './base';

interface SmartSearchInput {
  query: string;
}

interface SmartSearchOutput {
  intent: string;
  filters: Record<string, unknown>;
  refinedQuery: string;
}

export class SmartSearch extends BaseAIModule<SmartSearchInput, SmartSearchOutput> {
  name = 'SmartSearch';
  version = '1.0.0';
  provider: AIProviderType = 'openai';

  async process(input: SmartSearchInput) {
    const startTime = Date.now();

    const keywords = input.query.toLowerCase();
    const filters: Record<string, unknown> = {};

    // SUV / دفع رباعي
    if (/SUV|دفع رباعي|كروس|عائلية|كبيرة/i.test(keywords)) {
      filters.bodyType = 'SUV';
    }
    // السيدان
    if (/سيدان|صغيرة|اقتصادية/i.test(keywords)) {
      filters.bodyType = 'SEDAN';
    }
    // السعر
    const priceMatch = keywords.match(/(\d+[,]?\d*)\s*(دينار|الف|آلاف)/i);
    if (priceMatch) {
      const amount = parseInt(priceMatch[1].replace(',', ''));
      if (priceMatch[2].includes('الف') || priceMatch[2].includes('آلاف')) {
        filters.priceMax = amount * 1000;
      } else {
        filters.priceMax = amount;
      }
    }
    // الرياضية
    if (/شبابية|رياضية|محرك قوي|سباق/i.test(keywords)) {
      filters.bodyType = 'SPORTS';
    }
    // الاقتصادية
    if (/اقتصادية|موفرة|بنزين قليل/i.test(keywords)) {
      filters.fuelType = 'PETROL';
      filters.transmission = 'MANUAL';
    }
    // العائلية
    if (/عائلة|عائلية|كبيرة|7 راكب/i.test(keywords)) {
      filters.bodyType = 'SUV';
    }
    // الهجينة
    if (/هايبرد|كهرباء|هجينة/i.test(keywords)) {
      filters.fuelType = 'HYBRID';
    }
    // جديدة
    if (/جديد/i.test(keywords)) {
      filters.isNew = true;
    }

    return {
      success: true,
      data: {
        intent: 'search',
        filters,
        refinedQuery: input.query,
      },
      processingTime: Date.now() - startTime,
    };
  }
}

export const smartSearch = new SmartSearch({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o',
});
