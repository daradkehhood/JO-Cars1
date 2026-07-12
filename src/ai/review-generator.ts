export interface ReviewResult {
  structured: {
    title: string;
    pros: string[];
    cons: string[];
    verdict: string;
    summary: string;
  };
  ratings: {
    overall: number;
    engine: number;
    comfort: number;
    value: number;
    design: number;
    reliability: number;
  };
  confidence: number;
  wordCount: number;
}

const positiveWords: Record<string, string[]> = {
  engine: ['محرك', 'قوة', 'سرعة', 'أداء', 'turbo', 'تيربو', 'حريك', 'omech', 'mazbut', 'ممتاز', 'قوي', 'خوارق', 'fast', 'سريع'],
  comfort: ['راحة', 'مريح', 'ناعم', 'رفيع', 'واسع', 'قناص', 'comfy', 'spacious', 'مكين', 'جلد', 'دفايز', 'تكييف', 'تبريد'],
  value: ['سعر', 'قيمة', 'رخيص', 'اقتصادي', 'iean', 'monastery', 'munasib', 'مناسب', 'عادي', 'mnoo', 'عوالة'],
  design: ['شكل', 'تصميم', 'حلو', 'جميل', 'appealing', 'nice', 'أنيق', 'شيك', 'fancy', '外观', 'modeen', 'modern'],
  reliability: ['موثوق', 'موثوقية', 'mafoo', 'muthooq', 'quality', 'جودة', 'durable', 'م強い', 'mafoo7', 'mafoo', 'ما في مشاكل', 'ما شفت مشاكل', 'ممتازة'],
};

const negativeWords: Record<string, string[]> = {
  engine: ['بطيء', ' ضعيف', 'ما يشيل', 'ما يمشي', 'بطي', 'weak', 'slow', 'هالك', 'هلك', 'harraka', 'مكلّف'],
  comfort: ['قاسي', 'ضيق', 'صوت', 'اهتزاز', 'harsh', 'loud', 'noisy', 'matoo3', 'maatoo3', 'stiff', 'ما فيه راحة'],
  value: ['غالي', 'مرتفع', 'مبالغ', 'expensive', 'overpriced', 'غالية', 'فوق السعر', 'مبالغ فيها'],
  design: ['قبيح', 'قديم', 'عادي', 'ما يعجبني', 'ugly', 'old', 'boring', 'mamaal'],
  reliability: ['خرب', 'مشاكل', 'تصليح', 'repairs', 'problems', 'issues', 'broken', 'mashakel', 'مشكلة'],
};

const sectionPatterns = [
  { pattern: /(?:من ناحية|بخصوص|بالنسبة لل)?\s*(?:المحرك|الهيك|الحريك|engine)/i, category: 'engine' as const },
  { pattern: /(?:من ناحية|بخصوص|بالنسبة لل)?\s*(?:الراحة|المقاعد|الجلد|interior|comfort)/i, category: 'comfort' as const },
  { pattern: /(?:من ناحية|بخصوص|بالنسبة لل)?\s*(?:السعر|القيمة|الثمن|price|value)/i, category: 'value' as const },
  { pattern: /(?:من ناحية|بخصوص|بالنسبة لل)?\s*(?:الشكل|التصميم|اللون|design|exterior)/i, category: 'design' as const },
  { pattern: /(?:من ناحية|بخصوص|بالنسبة لل)?\s*(?:الموثوقية|الجودة|reliability|quality)/i, category: 'reliability' as const },
];

export function generateReview(text: string, carInfo?: { brand?: string; model?: string; year?: number }): ReviewResult {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lowerText = text.toLowerCase();

  const sentimentScores: Record<string, { pos: number; neg: number }> = {
    engine: { pos: 0, neg: 0 },
    comfort: { pos: 0, neg: 0 },
    value: { pos: 0, neg: 0 },
    design: { pos: 0, neg: 0 },
    reliability: { pos: 0, neg: 0 },
  };

  for (const [category, keywords] of Object.entries(positiveWords)) {
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) sentimentScores[category].pos++;
    }
  }
  for (const [category, keywords] of Object.entries(negativeWords)) {
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) sentimentScores[category].neg++;
    }
  }

  const sentences = text.split(/[.!?؟،\n]+/).filter(s => s.trim().length > 5);

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const isPositive = positiveWords.engine.some(kw => lowerSentence.includes(kw.toLowerCase())) ||
      positiveWords.comfort.some(kw => lowerSentence.includes(kw.toLowerCase())) ||
      positiveWords.value.some(kw => lowerSentence.includes(kw.toLowerCase())) ||
      positiveWords.design.some(kw => lowerSentence.includes(kw.toLowerCase())) ||
      positiveWords.reliability.some(kw => lowerSentence.includes(kw.toLowerCase()));
    const isNegative = negativeWords.engine.some(kw => lowerSentence.includes(kw.toLowerCase())) ||
      negativeWords.comfort.some(kw => lowerSentence.includes(kw.toLowerCase())) ||
      negativeWords.value.some(kw => lowerSentence.includes(kw.toLowerCase())) ||
      negativeWords.design.some(kw => lowerSentence.includes(kw.toLowerCase())) ||
      negativeWords.reliability.some(kw => lowerSentence.includes(kw.toLowerCase()));
  }

  const calculateRating = (category: string): number => {
    const s = sentimentScores[category];
    if (s.pos === 0 && s.neg === 0) return 3;
    const total = s.pos + s.neg;
    const ratio = s.pos / total;
    return Math.max(1, Math.min(5, Math.round(ratio * 4 + 1)));
  };

  const ratings = {
    overall: 0,
    engine: calculateRating('engine'),
    comfort: calculateRating('comfort'),
    value: calculateRating('value'),
    design: calculateRating('design'),
    reliability: calculateRating('reliability'),
  };

  ratings.overall = Math.round((ratings.engine + ratings.comfort + ratings.value + ratings.design + ratings.reliability) / 5);

  const pros: string[] = [];
  const cons: string[] = [];

  if (ratings.engine >= 4) pros.push('أداء محرك ممتاز');
  else if (ratings.engine <= 2) cons.push('أداء المحرك ضعيف');

  if (ratings.comfort >= 4) pros.push('راحة عالية');
  else if (ratings.comfort <= 2) cons.push('راحة غير مريحة');

  if (ratings.value >= 4) pros.push('قيمة ممتازة مقابل السعر');
  else if (ratings.value <= 2) cons.push('سعر مرتفع');

  if (ratings.design >= 4) pros.push('تصميم أنيق');
  else if (ratings.design <= 2) cons.push('تصميم عادي');

  if (ratings.reliability >= 4) pros.push('موثوقية عالية');
  else if (ratings.reliability <= 2) cons.push('مشاكل في الموثوقية');

  const specificMentions = sentences.filter(s => s.length > 15);

  let confidence = 0.3;
  if (wordCount >= 10) confidence += 0.1;
  if (wordCount >= 30) confidence += 0.1;
  if (wordCount >= 60) confidence += 0.1;
  if (specificMentions.length >= 3) confidence += 0.1;
  if (pros.length + cons.length >= 3) confidence += 0.1;
  if (Object.values(sentimentScores).some(s => s.pos > 2 || s.neg > 2)) confidence += 0.1;
  if (text.includes('!') || text.includes('؟')) confidence += 0.05;
  if (sentences.length >= 4) confidence += 0.05;
  confidence = Math.min(0.98, confidence);

  const carName = carInfo ? `${carInfo.brand || ''} ${carInfo.model || ''} ${carInfo.year || ''}`.trim() : '';

  const overallLabel = ratings.overall >= 4 ? 'ممتاز' : ratings.overall >= 3 ? 'جيد' : ratings.overall >= 2 ? 'مقبول' : 'ضعيف';

  let title = `مراجعة ${carName ? carName + ' — ' : ''}${overallLabel}`;
  let summary = '';

  if (pros.length > 0 && cons.length > 0) {
    summary = `${carName || 'السيارة'} ${pros[0].replace('أداء محرك ممتاز', 'تتميز بأداء محرك ممتاز').replace('راحة عالية', ' توفر راحة عالية').replace('قيمة ممتازة مقابل السعر', ' تقدم قيمة ممتازة').replace('تصميم أنيق', ' تأتي بتصميم أنيق').replace('موثوقية عالية', ' مع موثوقية عالية')}`;
    if (cons.length > 0) {
      summary += `، لكن ${cons[0].replace('أداء المحرك ضعيف', 'يواجه بعض التحديات في أداء المحرك').replace('راحة غير مريحة', 'تحتاج تحسينات في الراحة').replace('سعر مرتفع', 'سعره مرتفع نسبياً').replace('تصميم عادي', 'تصميمه عادي').replace('مشاكل في الموثوقية', 'هناك ملاحظات على الموثوقية')}`;
    }
    summary += '.';
  } else if (pros.length > 0) {
    summary = `${carName || 'السيارة'} ${pros.join(' و').replace('أداء محرك ممتاز', 'تتميز بأداء محرك ممتاز').replace('راحة عالية', 'توفر راحة عالية').replace('قيمة ممتازة مقابل السعر', 'تقدم قيمة ممتازة').replace('تصميم أنيق', 'تأتي بتصميم أنيق').replace('موثوقية عالية', 'وموثوقية عالية')}.`;
  } else {
    summary = `مراجعة شاملة لـ ${carName || 'السيارة'} تغطي الجوانب المختلفة.`;
  }

  if (cons.length === 0 && pros.length > 0) {
    cons.push('لم يتم ذكر عيوب rõحة');
  }

  const verdict = ratings.overall >= 4
    ? `أوصي بـ ${carName || 'هالسيارة'} بشدة. ${pros.length > 0 ? pros[0] : 'أداء عام ممتاز'}.`
    : ratings.overall >= 3
    ? `${carName || 'هالسيارة'} خيار جيد بشكل عام. ${pros.length > 0 ? 'لها مميزات واضحة' : ''}.`
    : `${carName || 'هالسيارة'} قد تحتاج مراجعة. ${cons.length > 0 ? 'فيها ملاحظات مهمة' : ''}.`;

  return {
    structured: { title, pros, cons, verdict, summary },
    ratings,
    confidence: Math.round(confidence * 100) / 100,
    wordCount,
  };
}
