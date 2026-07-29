/**
 * Engine Sound Database v1.0
 * Known engine sound patterns for analysis and diagnosis.
 * Maps frequency ranges, RPM patterns, and noise types to diagnoses.
 */
import OpenAI from 'openai';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'z-ai/glm-5.2';
export interface EngineSoundPattern {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'normal' | 'warning' | 'critical';
  frequencyRange: [number, number]; // Hz
  rpmRange?: [number, number];
  description: string;
  possibleCauses: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: string;
  recommendation: string;
}

export const ENGINE_SOUND_PATTERNS: EngineSoundPattern[] = [
  // ── NORMAL SOUNDS ──
  {
    id: 'normal-idle',
    nameAr: 'صوت المحرك الطبيعي في الخمول',
    nameEn: 'Normal Idle',
    category: 'normal',
    frequencyRange: [60, 150],
    rpmRange: [600, 900],
    description: 'صوت خافت ومنتظم — المحرك يعمل بشكل طبيعي',
    possibleCauses: ['لا توجد مشاكل'],
    urgency: 'low',
    estimatedCost: '0 د.أ',
    recommendation: 'المحرك يعمل بشكل ممتاز. لا يحتاج أي إجراء.',
  },
  {
    id: 'normal-acceleration',
    nameAr: 'صوت التسارع الطبيعي',
    nameEn: 'Normal Acceleration',
    category: 'normal',
    frequencyRange: [100, 400],
    rpmRange: [1500, 4000],
    description: 'صوت يزداد مع التسارع بشكل منتظم',
    possibleCauses: ['لا توجد مشاكل'],
    urgency: 'low',
    estimatedCost: '0 د.أ',
    recommendation: 'صوت طبيعي أثناء التسارع.',
  },
  // ── WARNING SOUNDS ──
  {
    id: 'ticking',
    nameAr: 'طقع مستمر',
    nameEn: 'Engine Tick',
    category: 'warning',
    frequencyRange: [1000, 4000],
    rpmRange: [1000, 3000],
    description: 'صوت طقع خفيف وسريع يزداد مع دوران المحرك',
    possibleCauses: [
      'نقص في زيت المحرك',
      'بستم متآكل',
      'ك Хоش متآكل',
      'صندوق التوقيت يحتاج ضبط',
    ],
    urgency: 'medium',
    estimatedCost: '50 - 300 د.أ',
    recommendation: 'افحص مستوى زيت المحرك فوراً. إذا كان منخفضاً، أضف زيتاً واذهب لورشة.',
  },
  {
    id: 'knocking',
    nameAr: 'قرقرة المحرك',
    nameEn: 'Engine Knock',
    category: 'critical',
    frequencyRange: [200, 800],
    rpmRange: [1500, 3500],
    description: 'صوت قرقرة عميق وثقيل يزداد مع الضغط على دواسة الوقود',
    possibleCauses: [
      'انصهار المحرك (Rod Knock)',
      'تآكل الأسطوانات',
      'مشكلة في البستم',
      'نوع وقود غير مناسب',
      'تلف في حامل المحرك',
    ],
    urgency: 'critical',
    estimatedCost: '500 - 3000 د.أ',
    recommendation: 'أوقف المحرك فوراً! هذا صوت خطير قد يؤدي لتعطل المحرك كاملاً. اتصل بورشة محترفة.',
  },
  {
    id: 'squealing',
    nameAr: 'صوت صفير حاد',
    nameEn: 'Serpentine Belt Squeal',
    category: 'warning',
    frequencyRange: [3000, 8000],
    description: 'صفير حاد عند تشغيل المحرك أو التوجيه',
    possibleCauses: [
      'حزام المكيف أو التوجيه متآكل',
      'حزام مرتخٍ',
      'بكرة متآكلة',
      'موتور التوجيه يحتاج زيت',
    ],
    urgency: 'medium',
    estimatedCost: '30 - 150 د.أ',
    recommendation: 'تحقق من حالة الحزام واستبداله إذا كان متآكلاً.',
  },
  {
    id: 'grinding',
    nameAr: 'صوت طحن أو احتكاك',
    nameEn: 'Grinding Noise',
    category: 'critical',
    frequencyRange: [200, 600],
    description: 'صوت احتكاك معدني حاد',
    possibleCauses: [
      'تآكل فرامل',
      'تآكل كاشف (Bearing)',
      'مشكلة في ناقل الحركة',
      'تآكل في المحرك',
    ],
    urgency: 'high',
    estimatedCost: '100 - 2000 د.أ',
    recommendation: 'توقف فوراً وافحص السيارة. القيادة قد تسبب تلفاً أكبر.',
  },
  {
    id: 'hissing',
    nameAr: 'صوت طنين أو إزيز',
    nameEn: 'Hissing',
    category: 'warning',
    frequencyRange: [500, 3000],
    description: 'صوت إزيز أو طنين مستمر',
    possibleCauses: [
      'تسريب في نظام التبريد',
      'تسريب في أنابيب الفرامل',
      'تسريب في المكيف',
      'مشكلة في صمام التحكم بالهواء',
    ],
    urgency: 'medium',
    estimatedCost: '50 - 500 د.أ',
    recommendation: 'تحقق من مستويات السوائل وابحث عن تسريبات.',
  },
  {
    id: 'rumbling',
    nameAr: 'صوت تأرجح منخفض',
    nameEn: 'Rumbling/Exhaust Leak',
    category: 'warning',
    frequencyRange: [50, 200],
    description: 'صوت تأرجح منخفض من العادم',
    possibleCauses: [
      'تسريب في نظام العادم',
      'حامل العادم متآكل',
      'كاتم الصوت متضرر',
    ],
    urgency: 'medium',
    estimatedCost: '50 - 400 د.أ',
    recommendation: 'افحص نظام العادم — التسريب قد يسبب زيادة استهلاك الوقود.',
  },
  {
    id: 'popping',
    nameAr: 'صوت فرقعة',
    nameEn: 'Popping/Backfire',
    category: 'warning',
    frequencyRange: [100, 600],
    description: 'صوت فرقعة من المحرك أو العادم',
    possibleCauses: [
      'مشكلة في نظام الوقود',
      'بوجيهات متآكلة',
      'تسريب في السحب (Intake)',
      'توقيت القدح غير صحيح',
    ],
    urgency: 'medium',
    estimatedCost: '30 - 300 د.أ',
    recommendation: 'افحص البوجيهات ونظام الوقود.',
  },
  {
    id: 'whining',
    nameAr: 'صوت ونين مستمر',
    nameEn: 'Whining (Turbo/Pump)',
    category: 'warning',
    frequencyRange: [1000, 5000],
    description: 'صوت ونين عالي يزداد مع التسارع',
    possibleCauses: [
      'تلوث في مضخة الوقود',
      'تلوث في التيربو',
      'نقص في زيت المحرك',
      'بكرة متآكلة',
    ],
    urgency: 'medium',
    estimatedCost: '50 - 500 د.أ',
    recommendation: 'تحقق من زيت المحرك ومستوى الوقود.',
  },
  {
    id: 'clicking',
    nameAr: 'صوت نقر خفيف',
    nameEn: 'Lifter Click',
    category: 'warning',
    frequencyRange: [800, 3000],
    rpmRange: [1000, 2500],
    description: 'صوت نقر خفيف وسريع يقل مع تسخين المحرك',
    possibleCauses: [
      'قلة زيت المحرك',
      ' Lifters متآكلة',
      'حاجة لتنظيف المحرك',
    ],
    urgency: 'low',
    estimatedCost: '20 - 100 د.أ',
    recommendation: 'غيّر زيت المحرك واستخدم زيتاً أسمك. إذا استمر الصوت، اذهب لورشة.',
  },
  {
    id: 'shuddering',
    nameAr: 'اهتزاز أو رجفة',
    nameEn: 'Engine Shudder',
    category: 'warning',
    frequencyRange: [20, 80],
    description: 'اهتزاز ملحوظ في المحرك أو الهيكل',
    possibleCauses: [
      'حامل المحرك (Engine Mount) متآكل',
      'بوجيهات تحتاج تبديل',
      'توازن المحرك غير صحيح',
      'حاجة لعمل تنظيف للوقود',
    ],
    urgency: 'medium',
    estimatedCost: '30 - 400 د.أ',
    recommendation: 'افحص حامل المحرك والبوجيهات.',
  },
];

/**
 * Identify engine sound pattern from audio analysis data.
 * Uses frequency analysis, RPM estimation, and noise classification.
 */
export function identifySoundPattern(analysis: {
  dominantFrequency: number;
  averageRms: number;
  peakFrequency: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  duration: number;
}): { pattern: EngineSoundPattern; confidence: number; isEngineSound: boolean } {
  const freq = analysis.dominantFrequency;
  const rms = analysis.averageRms;
  const zcr = analysis.zeroCrossingRate;
  const centroid = analysis.spectralCentroid;

  // Check if it sounds like an engine vs human voice/other
  const isEngineSound = detectIfEngineSound(analysis);

  if (!isEngineSound) {
    return {
      pattern: ENGINE_SOUND_PATTERNS[0], // Return normal as default
      confidence: 0.9,
      isEngineSound: false,
    };
  }

  // Find best matching pattern
  let bestMatch = ENGINE_SOUND_PATTERNS[0];
  let bestScore = 0;

  for (const pattern of ENGINE_SOUND_PATTERNS) {
    let score = 0;

    // Frequency match (most important)
    if (freq >= pattern.frequencyRange[0] && freq <= pattern.frequencyRange[1]) {
      score += 50;
      // Better score for closer to center
      const center = (pattern.frequencyRange[0] + pattern.frequencyRange[1]) / 2;
      const distance = Math.abs(freq - center) / (pattern.frequencyRange[1] - pattern.frequencyRange[0]);
      score += (1 - distance) * 20;
    } else {
      // How far outside the range
      const distLow = Math.abs(freq - pattern.frequencyRange[0]);
      const distHigh = Math.abs(freq - pattern.frequencyRange[1]);
      const minDist = Math.min(distLow, distHigh);
      score += Math.max(0, 10 - minDist / 100);
    }

    // RMS energy match (louder = more concerning)
    if (rms > 0.3 && pattern.category === 'critical') score += 15;
    else if (rms > 0.2 && pattern.category === 'warning') score += 10;
    else if (rms < 0.1 && pattern.category === 'normal') score += 15;

    // Zero crossing rate (higher for clicking/ticking)
    if (zcr > 0.1 && ['ticking', 'clicking', 'squealing'].includes(pattern.id)) score += 10;
    if (zcr < 0.05 && ['knocking', 'rumbling', 'shuddering'].includes(pattern.id)) score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  const confidence = Math.min(bestScore / 95, 1);

  return {
    pattern: bestMatch,
    confidence,
    isEngineSound: true,
  };
}

/**
 * Detect if the audio is engine sound vs human voice or other noise.
 * Uses multiple audio features for classification.
 */
function detectIfEngineSound(analysis: {
  dominantFrequency: number;
  averageRms: number;
  peakFrequency: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  duration: number;
}): boolean {
  const { dominantFrequency, zeroCrossingRate, spectralCentroid, duration } = analysis;

  // Engine characteristics:
  // 1. Low dominant frequency (60-500 Hz typical for engines)
  const hasLowFreq = dominantFrequency < 500;

  // 2. Low zero crossing rate (engines have more periodic signals)
  const hasLowZCR = zeroCrossingRate < 0.15;

  // 3. Moderate spectral centroid (not too high like speech, not too low)
  const hasModerateCentroid = spectralCentroid > 200 && spectralCentroid < 3000;

  // 4. Reasonable duration (at least 1 second)
  const hasDuration = duration >= 1;

  // Score-based classification
  let score = 0;
  if (hasLowFreq) score += 30;
  if (hasLowZCR) score += 25;
  if (hasModerateCentroid) score += 25;
  if (hasDuration) score += 20;

  // Human voice characteristics (for exclusion):
  // - Higher ZCR (0.1-0.3)
  // - Higher centroid (1000-4000 Hz)
  // - Lower dominant frequency variation
  const isVoiceLike = zeroCrossingRate > 0.1 && spectralCentroid > 1000 && spectralCentroid < 4000;
  if (isVoiceLike) score -= 30;

  return score >= 40;
}

/**
 * Generate a comprehensive diagnosis report from audio analysis.
 */
export function generateDiagnosis(
  analysis: {
    dominantFrequency: number;
    averageRms: number;
    peakFrequency: number;
    zeroCrossingRate: number;
    spectralCentroid: number;
    duration: number;
  },
  carInfo?: { brand?: string; model?: string; year?: number; kilometers?: number }
): {
  isEngineSound: boolean;
  pattern: EngineSoundPattern;
  confidence: number;
  report: string;
  recommendations: string[];
} {
  const { pattern, confidence, isEngineSound } = identifySoundPattern(analysis);

  if (!isEngineSound) {
    return {
      isEngineSound: false,
      pattern,
      confidence,
      report: `⚠️ **الصوت المسجل لا يبدو كصوت محرك سيارة.**

يبدو أن الصوت更像是 صوت ${analysis.zeroCrossingRate > 0.1 ? 'إنسان أو حوار' : 'ضوضاء عامة'}.

**نصيحة:** حاول تسجيل صوت المحرك مباشرة من خلال فتح غطاء المحرك while the engine is running. تأكد من أن التسجيل يكون في مكان هادئ.`,
      recommendations: [
        'أوقف المحرك وافتح غطاء المحرك',
        'سجّل الصوت من المسافة 30-50 سم من المحرك',
        'تجنب التسجيل في مكان فيه ضوضاء',
        'سجّل أثناء الخمول والتسارع',
      ],
    };
  }

  let report = `🔍 **تشخيص صوت المحرك**\n\n`;
  report += `📊 **النتيجة:** ${pattern.nameAr}\n`;
  report += `⚡ **التصنيف:** ${pattern.category === 'normal' ? '✅ طبيعي' : pattern.category === 'warning' ? '⚠️ تحذيري' : '🚨 حرج'}\n`;
  report += `📈 **الثقة:** ${Math.round(confidence * 100)}%\n\n`;
  report += `📝 **الوصف:** ${pattern.description}\n\n`;

  if (carInfo) {
    report += `🚗 **السيارة:** ${carInfo.brand || ''} ${carInfo.model || ''} ${carInfo.year || ''}\n`;
    if (carInfo.kilometers) {
      report += `🛣️ **الممشى:** ${carInfo.kilometers.toLocaleString()} كم\n`;
    }
    report += '\n';
  }

  report += `🔧 **الأسباب المحتملة:**\n`;
  pattern.possibleCauses.forEach((cause, i) => {
    report += `${i + 1}. ${cause}\n`;
  });

  report += `\n💰 **التكلفة التقديرية:** ${pattern.estimatedCost}\n`;
  report += `\n💡 **التوصية:** ${pattern.recommendation}\n`;

  const recommendations = [...pattern.recommendation.split('. ')];

  // Add urgency-specific advice
  if (pattern.urgency === 'critical') {
    report += '\n🚨 **تنبيه عاجل:** لا تستمر بالقيادة! قد ينتج عن ذلك تلف خطير في المحرك.';
    recommendations.unshift('أوقف المحرك فوراً');
    recommendations.unshift('لا تستمر بالقيادة');
  } else if (pattern.urgency === 'high') {
    report += '\n⚠️ **ملاحظة:** يُفضل عدم القيادة لمسافات طويلة.';
  }

  return {
    isEngineSound: true,
    pattern,
    confidence,
    report,
    recommendations,
  };
}
