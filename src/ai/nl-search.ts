/**
 * Natural Language Search Parser v1.0
 * Converts Arabic natural language queries into structured search filters.
 * Supports Jordanian/Gulf/Egyptian/Levantine dialects, typos, and fuzzy matching.
 * Integrates with JO Cars existing car search, workshop, and parts APIs.
 */

import { BRAND_PRICE_RANGES } from './site-knowledge';

// ── Types ──
export interface ParsedSearchQuery {
  intent: 'car' | 'workshop' | 'parts' | 'price' | 'general';
  brand: string | null;
  brandEn: string | null;
  model: string | null;
  modelEn: string | null;
  year: { min: number; max: number } | null;
  price: { min: number; max: number } | null;
  budget: number | null;
  city: string | null;
  bodyType: string | null;
  fuelType: string | null;
  transmission: string | null;
  condition: string | null;
  kilometers: { max: number } | null;
  sortBy: string;
  query: string;
  originalQuery: string;
  confidence: number;
  serviceType: string | null; // for workshops
}

// ── Arabic Dialect Normalization ──
const DIALECT_NORMALIZATION: Record<string, string> = {
  // Jordanian
  'بدي': 'اريد', 'بدك': 'تريد', 'بده': 'يريد', 'شو': 'ماذا',
  'هيك': 'هكذا', 'ليش': 'لماذا', 'وين': 'أين', 'امتى': 'متى',
  'هون': 'هنا', 'هاي': 'هذه', 'يعني': 'اي', 'ابي': 'اريد',
  'بدّي': 'اريد', 'ما في': 'لا يوجد', 'فيي': 'امكنني',
  // Gulf
  'وش': 'ماذا', 'جذي': 'هكذا', 'ابغى': 'اريد', 'وشبها': 'ماذا بها',
  // Egyptian
  'عايز': 'اريد', 'ايه': 'ماذا', 'كدا': 'هكذا', 'ليه': 'لماذا',
  'فين': 'أين', 'امتي': 'متى', 'هناك': 'هنا',
  // Lebanese/Syrian
  'عم': 'يقوم بـ', 'هلق': 'الآن', 'ساعات': 'أحياناً',
};

// ── Brand Aliases (Arabic + English + Typos) ──
const BRAND_ALIASES: Record<string, string> = {
  // Arabic names
  'تويوتا': 'toyota', 'تويتا': 'toyota',
  'هوندا': 'honda', 'هونداي': 'hyundai', 'هيونداي': 'hyundai',
  'نيسان': 'nissan',
  'كيا': 'kia', 'مازدا': 'mazda',
  'فورد': 'ford', 'شفروليت': 'chevrolet', 'شفروليه': 'chevrolet',
  'بي ام دبليو': 'bmw', 'ب ام دبليو': 'bmw', 'بي ام': 'bmw', 'ب ام': 'bmw',
  'مرسيدس': 'mercedes', 'مرسيديس': 'mercedes',
  'أودي': 'audi', 'اودي': 'audi',
  'لكزس': 'lexus', 'لكسز': 'lexus',
  'سوزوكي': 'suzuki', 'سوзуكي': 'suzuki',
  'ام جي': 'mg',
  'شيري': 'chery',
  'جيلي': 'geely', 'بي واي دي': 'byd', 'BYD': 'byd',
  'هافال': 'haval', 'جيب': 'jeep',
  'ميتسوبيشي': 'mitsubishi', 'لاند روفر': 'land rover',
  'فولكس فاجن': 'volkswagen', 'فولكس': 'volkswagen',
  'بيجو': 'peugeot', 'سوبارو': 'subaru',
  'أوبل': 'opel', 'رينو': 'renault', 'فيات': 'fiat',
  'دودج': 'dodge', 'جي ام سي': 'gmc',
  // English
  'toyota': 'toyota', 'honda': 'honda', 'hyundai': 'hyundai',
  'nissan': 'nissan', 'kia': 'kia', 'mazda': 'mazda',
  'ford': 'ford', 'chevrolet': 'chevrolet', 'bmw': 'bmw',
  'mercedes': 'mercedes', 'audi': 'audi', 'lexus': 'lexus',
  'suzuki': 'suzuki', 'mg': 'mg', 'chery': 'chery',
  'geely': 'geely', 'byd': 'byd', 'haval': 'haval',
  'jeep': 'jeep', 'mitsubishi': 'mitsubishi', 'volkswagen': 'volkswagen',
  'peugeot': 'peugeot', 'subaru': 'subaru', 'opel': 'opel',
  'renault': 'renault', 'fiat': 'fiat', 'dodge': 'dodge', 'gmc': 'gmc',
  // Common typos
  'تو يوتا': 'toyota', 'توتا': 'toyota', 'تفيوتا': 'toyota',
  'هوندااي': 'hyundai', 'نيسسن': 'nissan', 'nisn': 'nissan',
  'مسدا': 'mazda', 'شرفروليت': 'chevrolet',
  'مرسيدس بنز': 'mercedes',
};

// ── Model Aliases ──
const MODEL_ALIASES: Record<string, { brand: string; modelEn: string; modelAr: string }> = {
  // Toyota
  'كامري': { brand: 'toyota', modelEn: 'camry', modelAr: 'كامري' },
  'كورولا': { brand: 'toyota', modelEn: 'corolla', modelAr: 'كورولا' },
  'لاند كروزر': { brand: 'toyota', modelEn: 'land cruiser', modelAr: 'لاند كروزر' },
  'لاندكروزر': { brand: 'toyota', modelEn: 'land cruiser', modelAr: 'لاند كروزر' },
  'لاند كروز': { brand: 'toyota', modelEn: 'land cruiser', modelAr: 'لاند كروزر' },
  'رافي 4': { brand: 'toyota', modelEn: 'rav4', modelAr: 'رافي 4' },
  'راف 4': { brand: 'toyota', modelEn: 'rav4', modelAr: 'رافي 4' },
  'رافي4': { brand: 'toyota', modelEn: 'rav4', modelAr: 'رافي 4' },
  'هيلوكس': { brand: 'toyota', modelEn: 'hilux', modelAr: 'هيلوكس' },
  'فورتشنر': { brand: 'toyota', modelEn: 'fortuner', modelAr: 'فورتشنر' },
  'فورتونر': { brand: 'toyota', modelEn: 'fortuner', modelAr: 'فورتشنر' },
  'سينتا': { brand: 'toyota', modelEn: 'sienta', modelAr: 'سينتا' },
  'يارس': { brand: 'toyota', modelEn: 'yaris', modelAr: 'يارس' },
  'برادو': { brand: 'toyota', modelEn: 'prado', modelAr: 'برادو' },
  // Honda
  'سيفيك': { brand: 'honda', modelEn: 'civic', modelAr: 'سيفيك' },
  'أكورد': { brand: 'honda', modelEn: 'accord', modelAr: 'أكورد' },
  'اكورد': { brand: 'honda', modelEn: 'accord', modelAr: 'أكورد' },
  'سي آر في': { brand: 'honda', modelEn: 'cr-v', modelAr: 'سي آر في' },
  'CRV': { brand: 'honda', modelEn: 'cr-v', modelAr: 'سي آر في' },
  'CR-V': { brand: 'honda', modelEn: 'cr-v', modelAr: 'سي آر في' },
  'HRV': { brand: 'honda', modelEn: 'hr-v', modelAr: 'HRV' },
  'HR-V': { brand: 'honda', modelEn: 'hr-v', modelAr: 'HRV' },
  // Hyundai
  'إلنترا': { brand: 'hyundai', modelEn: 'elantra', modelAr: 'إلنترا' },
  'النترا': { brand: 'hyundai', modelEn: 'elantra', modelAr: 'إلنترا' },
  'سوناتا': { brand: 'hyundai', modelEn: 'sonata', modelAr: 'سوناتا' },
  'توسان': { brand: 'hyundai', modelEn: 'tucson', modelAr: 'توسان' },
  'تسونان': { brand: 'hyundai', modelEn: 'tucson', modelAr: 'توسان' },
  'سانتا في': { brand: 'hyundai', modelEn: 'santa fe', modelAr: 'سانتا في' },
  'سانتافي': { brand: 'hyundai', modelEn: 'santa fe', modelAr: 'سانتا في' },
  'كונה': { brand: 'hyundai', modelEn: 'kona', modelAr: 'كונה' },
  'أكسنت': { brand: 'hyundai', modelEn: 'accent', modelAr: 'أكسنت' },
  'اكسنت': { brand: 'hyundai', modelEn: 'accent', modelAr: 'أكسنت' },
  // Nissan
  'سنترا': { brand: 'nissan', modelEn: 'sentra', modelAr: 'سنترا' },
  'سني': { brand: 'nissan', modelEn: 'sunny', modelAr: 'سني' },
  'باترول': { brand: 'nissan', modelEn: 'patrol', modelAr: 'باترول' },
  'اكس تريل': { brand: 'nissan', modelEn: 'x-trail', modelAr: 'اكس تريل' },
  'اكسترايل': { brand: 'nissan', modelEn: 'x-trail', modelAr: 'اكس تريل' },
  'قاشقاي': { brand: 'nissan', modelEn: 'qashqai', modelAr: 'قاشقاي' },
  'قشقاي': { brand: 'nissan', modelEn: 'qashqai', modelAr: 'قشقاي' },
  'مكسيما': { brand: 'nissan', modelEn: 'maxima', modelAr: 'مكسيما' },
  // Kia
  'سيراتو': { brand: 'kia', modelEn: 'cerato', modelAr: 'سيراتو' },
  'سبورتاج': { brand: 'kia', modelEn: 'sportage', modelAr: 'سبورتاج' },
  'سورنتو': { brand: 'kia', modelEn: 'sorento', modelAr: 'سورنتو' },
  'ريو': { brand: 'kia', modelEn: 'rio', modelAr: 'ريو' },
  'بيكانتو': { brand: 'kia', modelEn: 'picanto', modelAr: 'بيكانتو' },
  'بيكاناتو': { brand: 'kia', modelEn: 'picanto', modelAr: 'بيكانتو' },
  'كيد': { brand: 'kia', modelEn: 'ceed', modelAr: 'كيد' },
  'ستونيك': { brand: 'kia', modelEn: 'stonic', modelAr: 'ستونيك' },
  // Mazda
  'مازدا 3': { brand: 'mazda', modelEn: 'mazda3', modelAr: 'مازدا 3' },
  'مازدا6': { brand: 'mazda', modelEn: 'mazda6', modelAr: 'مازدا 6' },
  'مازدا 6': { brand: 'mazda', modelEn: 'mazda6', modelAr: 'مازدا 6' },
  'CX-5': { brand: 'mazda', modelEn: 'cx-5', modelAr: 'CX-5' },
  'CX-9': { brand: 'mazda', modelEn: 'cx-9', modelAr: 'CX-9' },
  'CX-30': { brand: 'mazda', modelEn: 'cx-30', modelAr: 'CX-30' },
  'سي اكس 5': { brand: 'mazda', modelEn: 'cx-5', modelAr: 'CX-5' },
  // Ford
  'فوكس': { brand: 'ford', modelEn: 'focus', modelAr: 'فوكس' },
  'إسكييب': { brand: 'ford', modelEn: 'escape', modelAr: 'إسكييب' },
  'اسكييب': { brand: 'ford', modelEn: 'escape', modelAr: 'إسكييب' },
  'إكسبلورر': { brand: 'ford', modelEn: 'explorer', modelAr: 'إكسبلورر' },
  'اكسبلورر': { brand: 'ford', modelEn: 'explorer', modelAr: 'إكسبلورر' },
  'رانجر': { brand: 'ford', modelEn: 'ranger', modelAr: 'رانجر' },
  'موستانج': { brand: 'ford', modelEn: 'mustang', modelAr: 'موستانج' },
  // Chevrolet
  'كروز': { brand: 'chevrolet', modelEn: 'cruze', modelAr: 'كروز' },
  'ماليبو': { brand: 'chevrolet', modelEn: 'malibu', modelAr: 'ماليبو' },
  'كابتيفا': { brand: 'chevrolet', modelEn: 'captiva', modelAr: 'كابتيفا' },
  'تاهو': { brand: 'chevrolet', modelEn: 'tahoe', modelAr: 'تاهو' },
  'كولورادو': { brand: 'chevrolet', modelEn: 'colorado', modelAr: 'كولورادو' },
  // BMW
  'سلسلة 3': { brand: 'bmw', modelEn: '3 series', modelAr: 'سلسلة 3' },
  'الفئة الثالثة': { brand: 'bmw', modelEn: '3 series', modelAr: 'سلسلة 3' },
  'سلسلة 5': { brand: 'bmw', modelEn: '5 series', modelAr: 'سلسلة 5' },
  'الفئة الخامسة': { brand: 'bmw', modelEn: '5 series', modelAr: 'سلسلة 5' },
  'X3': { brand: 'bmw', modelEn: 'x3', modelAr: 'X3' },
  'X5': { brand: 'bmw', modelEn: 'x5', modelAr: 'X5' },
  'X1': { brand: 'bmw', modelEn: 'x1', modelAr: 'X1' },
  // Mercedes
  'C-Class': { brand: 'mercedes', modelEn: 'c-class', modelAr: 'C-Class' },
  'سي كلاس': { brand: 'mercedes', modelEn: 'c-class', modelAr: 'C-Class' },
  'E-Class': { brand: 'mercedes', modelEn: 'e-class', modelAr: 'E-Class' },
  'GLC': { brand: 'mercedes', modelEn: 'glc', modelAr: 'GLC' },
  'GLE': { brand: 'mercedes', modelEn: 'gle', modelAr: 'GLE' },
  // Suzuki
  'swift': { brand: 'suzuki', modelEn: 'swift', modelAr: 'سويفت' },
  'سويفت': { brand: 'suzuki', modelEn: 'swift', modelAr: 'سويفت' },
  'جيمني': { brand: 'suzuki', modelEn: 'jimny', modelAr: 'جيمني' },
  'فيتارا': { brand: 'suzuki', modelEn: 'vitara', modelAr: 'فيتارا' },
  // Common misspellings
  'كامري 2020': { brand: 'toyota', modelEn: 'camry', modelAr: 'كامري' },
  'كامري 2021': { brand: 'toyota', modelEn: 'camry', modelAr: 'كامري' },
  'كامري 2022': { brand: 'toyota', modelEn: 'camry', modelAr: 'كامري' },
  'كامري 2023': { brand: 'toyota', modelEn: 'camry', modelAr: 'كامري' },
  'كامري 2024': { brand: 'toyota', modelEn: 'camry', modelAr: 'كامري' },
  'كورولا 2020': { brand: 'toyota', modelEn: 'corolla', modelAr: 'كورولا' },
  'كورولا 2021': { brand: 'toyota', modelEn: 'corolla', modelAr: 'كورولا' },
  'كورولا 2022': { brand: 'toyota', modelEn: 'corolla', modelAr: 'كورولا' },
  'كورولا 2023': { brand: 'toyota', modelEn: 'corolla', modelAr: 'كورولا' },
};

// ── Body Type Keywords ──
const BODY_TYPE_KEYWORDS: Record<string, string[]> = {
  'SUV': ['suv', 'دفع رباعي', 'جيب', 'كروس', 'كروس اوفر', 'crossover', 'دفع 4', ' رباعي'],
  'SEDAN': ['سيدان', 'سيداني', 'صغيرة', 'sedan'],
  'HATCHBACK': ['هاتشباك', 'hatchback'],
  'COUPE': ['كوبيه', 'رياضية', 'coupe'],
  'PICKUP': ['بيك أب', 'بيك اب', 'شاحنة', 'pickup', 'لانكruz'],
  'VAN': ['فان', 'فانات', 'minivan', 'ميكروباص'],
  'WAGON': ['واقيون', 'استيشن', 'wagon', 'station'],
};

// ── Fuel Type Keywords ──
const FUEL_TYPE_KEYWORDS: Record<string, string[]> = {
  'PETROL': ['بنزين', 'وقود', 'اقتصادية', 'موفرة'],
  'DIESEL': ['ديزل', 'سولار', 'diesel', 'ديزيل'],
  'HYBRID': ['هايبرد', 'هجين', 'hybrid', 'هجينة'],
  'ELECTRIC': ['كهربائية', 'كهرباء', 'electric', 'كهربا', 'بلاغ'],
};

// ── Transmission Keywords ──
const TRANSMISSION_KEYWORDS: Record<string, string[]> = {
  'AUTOMATIC': ['أوتوماتيك', 'اتوماتيك', 'تلقائي', 'automatic', 'اتوماتك'],
  'MANUAL': ['يدوي', 'مانوال', 'manual'],
};

// ── Condition Keywords ──
const CONDITION_KEYWORDS: Record<string, string[]> = {
  'EXCELLENT': ['ممتازة', 'جديدة', 'ممتاز', 'like new', 'زي الجديد'],
  'VERY_GOOD': ['جيدة جداً', 'جيدة جدا', 'ممتازة جداً', 'ممتازة جدا'],
  'GOOD': ['جيدة', 'جيده', 'مقبولة'],
  'FAIR': ['مقبولة', 'مقبول', 'قابلة للإصلاح'],
};

// ── City Aliases ──
const CITY_ALIASES: Record<string, string[]> = {
  'عمان': ['عمان', 'عمّان', 'amman', 'امان'],
  'الزرقاء': ['الزرقاء', 'zqaqa', 'زراقا'],
  'إربد': ['إربد', 'irbid', 'اربد'],
  'السلط': ['السلط', 'salt'],
  'العقبة': ['الLEGRO', 'aqaba', 'عقبة', 'العقبة'],
  'المفرق': ['المفرق', 'mafraq', 'مفرق'],
  'الكرك': ['الكرك', 'karak', 'كرك'],
  'معان': ['معان', "ma'an", 'معّان'],
  'جرش': ['جرش', 'jarash', 'جرّش'],
  'عجلون': ['عجلون', 'ajloun', 'عجلّون'],
};

// ── Service Type Keywords (for workshops) ──
const SERVICE_KEYWORDS: Record<string, string[]> = {
  'ميكانيكية': ['ميكانيك', 'محرك', 'صيانة', 'mechanic', 'مكانيك'],
  'كهرباء': ['كهرباء', 'كهربائي', 'electric', 'الكترونيات'],
  'هيكلية': ['هيكل', 'دهان', 'تصليح هيكل', 'body'],
  'فحم وفرامل': ['فحم', 'فرامل', 'brake', 'فرامل'],
  'تكييف': ['تكييف', 'مكيف', 'ac', 'ac compressor', 'كمبروسر'],
  'إطارات': ['ايرات', 'اطارات', 'tire', 'tire', 'كاوتش'],
  'زجاج': ['زجاج', 'glass', 'شيش'],
  'صرخات': ['صرخة', 'صرخات', 'steering'],
  'كمبيوتر': ['كمبيوتر', 'حاسوب', 'computer', 'برمجة'],
};

// ── Utility: Levenshtein Distance for Fuzzy Matching ──
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ── Utility: Fuzzy Match ──
function fuzzyMatch(input: string, candidates: string[], threshold: number = 2): string | null {
  const normalized = input.toLowerCase().trim();

  // Exact match first
  for (const candidate of candidates) {
    if (candidate.toLowerCase() === normalized) return candidate;
  }

  // Contains match
  for (const candidate of candidates) {
    if (candidate.toLowerCase().includes(normalized) || normalized.includes(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // Fuzzy match with Levenshtein
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(normalized, candidate.toLowerCase());
    if (distance < bestDistance && distance <= threshold) {
      bestDistance = distance;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

// ── Extract Year from Query ──
function extractYear(query: string): { min: number; max: number } | null {
  // Match 4-digit years (2000-2030)
  const yearMatches = query.match(/\b(20[0-3]\d)\b/g);
  if (!yearMatches) return null;

  const years = yearMatches.map(y => parseInt(y)).filter(y => y >= 2000 && y <= 2030);
  if (years.length === 0) return null;

  if (years.length === 1) {
    // Single year: search for that year ±1
    return { min: years[0] - 1, max: years[0] + 1 };
  }

  // Range: min to max
  return { min: Math.min(...years), max: Math.max(...years) };
}

// ── Extract Price/Budget from Query ──
function extractBudget(query: string): { min: number; max: number } | null {
  // Match patterns like "15000 دينار", "8000 د.أ", "15 ألف", "10k"
  const patterns = [
    /(\d[\d,]*)\s*(?:دينار|د\.أ|JOD|jod)/i,
    /(?:ميزانية|مبلغ|بـ|بسعر|بمبلغ|بقيمة)\s*(\d[\d,]*)/i,
    /(\d[\d,]*)\s*(?:ألف|الف|k|K)/i,
    /(?:تحت|أقل من|עד|لحد| hasta)\s*(\d[\d,]*)/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      let num = parseInt(match[1].replace(/,/g, ''));
      // Handle "ألف" suffix
      if (/\b(?:ألف|الف|k|K)\b/i.test(query) && num < 1000) {
        num *= 1000;
      }
      if (num >= 500 && num <= 500000) {
        // Add 20% buffer for max
        return { min: Math.max(0, num - 1000), max: num + Math.round(num * 0.2) };
      }
    }
  }

  // Try plain numbers
  const numMatch = query.match(/\b(\d{4,6})\b/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num >= 1000 && num <= 500000) {
      return { min: Math.max(0, num - 1000), max: num + Math.round(num * 0.2) };
    }
  }

  return null;
}

// ── Extract Kilometers from Query ──
function extractKilometers(query: string): { max: number } | null {
  const patterns = [
    /(\d[\d,]*)\s*(?:كم|كيلومتر|kilometer|km)/i,
    /(?:ممشى|مشي)\s*(\d[\d,]*)/i,
    /(?:أقل من|تحت|עד|less than)\s*(\d[\d,]*)\s*(?:كم|km)?/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const km = parseInt(match[1].replace(/,/g, ''));
      if (km >= 100 && km <= 500000) {
        return { max: km };
      }
    }
  }

  return null;
}

// ── Detect Intent ──
function detectSearchIntent(query: string): ParsedSearchQuery['intent'] {
  const q = query.toLowerCase();

  // Workshop indicators
  const workshopKeywords = ['ورشة', 'ورش', 'تصليح', 'إصلاح', 'صيانة', 'ميكانيك', 'كهرباء', 'هيكل', 'فحم', 'فرامل', 'تكييف', 'اطارات'];
  if (workshopKeywords.some(kw => q.includes(kw))) return 'workshop';

  // Parts indicators
  const partsKeywords = ['قطعة', 'قطع غيار', 'بواجي', 'فحم', 'فلتر', 'زيت', 'رديتر', 'مكيف', 'kompressor'];
  if (partsKeywords.some(kw => q.includes(kw))) return 'parts';

  // Price analysis indicators
  const priceKeywords = ['سعر', 'تقدير', 'تقييم', 'قيمة', 'شحال سعر', 'كم سعر', 'تقديري'];
  if (priceKeywords.some(kw => q.includes(kw))) return 'price';

  return 'car';
}

// ── Main: Parse Natural Language Query ──
export function parseNaturalLanguageQuery(query: string): ParsedSearchQuery {
  const originalQuery = query;

  // Normalize dialect
  let normalized = query;
  for (const [dialect, msa] of Object.entries(DIALECT_NORMALIZATION)) {
    normalized = normalized.replace(new RegExp(dialect, 'gi'), msa);
  }

  const q = normalized.toLowerCase();

  // Detect intent
  const intent = detectSearchIntent(q);

  // Extract brand
  let brand: string | null = null;
  let brandEn: string | null = null;

  // Check direct brand aliases
  for (const [alias, brandKey] of Object.entries(BRAND_ALIASES)) {
    if (q.includes(alias.toLowerCase())) {
      brand = BRAND_PRICE_RANGES[brandKey]?.nameAr || brandKey;
      brandEn = brandKey;
      break;
    }
  }

  // Check BRAND_PRICE_RANGES keys directly
  if (!brandEn) {
    for (const [key, data] of Object.entries(BRAND_PRICE_RANGES)) {
      if (q.includes(key) || q.includes(data.nameAr)) {
        brand = data.nameAr;
        brandEn = key;
        break;
      }
    }
  }

  // Extract model
  let model: string | null = null;
  let modelEn: string | null = null;

  for (const [alias, data] of Object.entries(MODEL_ALIASES)) {
    if (q.includes(alias.toLowerCase())) {
      model = data.modelAr;
      modelEn = data.modelEn;
      // If no brand was found, use the model's brand
      if (!brandEn) {
        brand = BRAND_PRICE_RANGES[data.brand]?.nameAr || data.brand;
        brandEn = data.brand;
      }
      break;
    }
  }

  // Extract year
  const year = extractYear(query); // Use original query for year (numbers don't change)

  // Extract budget/price
  const budget = extractBudget(query);
  const price = budget ? { min: budget.min, max: budget.max } : null;

  // Extract city
  let city: string | null = null;
  for (const [cityName, aliases] of Object.entries(CITY_ALIASES)) {
    for (const alias of aliases) {
      if (q.includes(alias.toLowerCase())) {
        city = cityName;
        break;
      }
    }
    if (city) break;
  }

  // Extract body type
  let bodyType: string | null = null;
  for (const [type, keywords] of Object.entries(BODY_TYPE_KEYWORDS)) {
    if (keywords.some(kw => q.includes(kw.toLowerCase()))) {
      bodyType = type;
      break;
    }
  }

  // Extract fuel type
  let fuelType: string | null = null;
  for (const [type, keywords] of Object.entries(FUEL_TYPE_KEYWORDS)) {
    if (keywords.some(kw => q.includes(kw.toLowerCase()))) {
      fuelType = type;
      break;
    }
  }

  // Extract transmission
  let transmission: string | null = null;
  for (const [type, keywords] of Object.entries(TRANSMISSION_KEYWORDS)) {
    if (keywords.some(kw => q.includes(kw.toLowerCase()))) {
      transmission = type;
      break;
    }
  }

  // Extract condition
  let condition: string | null = null;
  for (const [type, keywords] of Object.entries(CONDITION_KEYWORDS)) {
    if (keywords.some(kw => q.includes(kw.toLowerCase()))) {
      condition = type;
      break;
    }
  }

  // Extract kilometers
  const kilometers = extractKilometers(query);

  // Extract service type (for workshops)
  let serviceType: string | null = null;
  if (intent === 'workshop') {
    for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
      if (keywords.some(kw => q.includes(kw.toLowerCase()))) {
        serviceType = service;
        break;
      }
    }
  }

  // Detect sort preference
  let sortBy = 'createdAt';
  if (q.includes('أرخص') || q.includes('أقل سعر') || q.includes('ارخص')) sortBy = 'price_asc';
  else if (q.includes('أغلى') || q.includes('أعلى سعر')) sortBy = 'price_desc';
  else if (q.includes('جديد') || q.includes('أحدث')) sortBy = 'createdAt';
  else if (q.includes('الأكثر مشاهدة') || q.includes('شائع')) sortBy = 'views';

  // Calculate confidence
  let confidence = 0.5; // Base confidence
  if (brandEn) confidence += 0.2;
  if (modelEn) confidence += 0.15;
  if (year) confidence += 0.1;
  if (budget) confidence += 0.05;
  return {
    intent,
    brand,
    brandEn,
    model,
    modelEn,
    year,
    price,
    budget: budget ? budget.max : null,
    city,
    bodyType,
    fuelType,
    transmission,
    condition,
    kilometers,
    sortBy,
    query: normalized,
    originalQuery,
    confidence: Math.min(confidence, 1),
    serviceType,
  };
}

// ── Build API URL from Parsed Query ──
export function buildSearchUrl(parsed: ParsedSearchQuery, baseUrl: string = '/cars'): string {
  const params = new URLSearchParams();

  if (parsed.brandEn) params.set('search', parsed.brandEn);
  if (parsed.year) {
    if (parsed.year.min) params.set('yearMin', parsed.year.min.toString());
    if (parsed.year.max) params.set('yearMax', parsed.year.max.toString());
  }
  if (parsed.price) {
    if (parsed.price.min) params.set('priceMin', parsed.price.min.toString());
    if (parsed.price.max) params.set('priceMax', parsed.price.max.toString());
  }
  if (parsed.fuelType) params.set('fuelType', parsed.fuelType);
  if (parsed.transmission) params.set('transmission', parsed.transmission);
  if (parsed.condition) params.set('condition', parsed.condition);
  if (parsed.bodyType) params.set('bodyType', parsed.bodyType);
  if (parsed.kilometers) params.set('kilometersMax', parsed.kilometers.max.toString());

  const sortMap: Record<string, string> = {
    'price_asc': 'price',
    'price_desc': 'price',
    'createdAt': 'createdAt',
    'views': 'views',
  };
  if (sortMap[parsed.sortBy]) {
    params.set('sortBy', sortMap[parsed.sortBy]);
    params.set('sortOrder', parsed.sortBy === 'price_asc' ? 'asc' : 'desc');
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// ── Build Workshop Search URL ──
export function buildWorkshopSearchUrl(parsed: ParsedSearchQuery): string {
  const params = new URLSearchParams();

  if (parsed.serviceType) params.set('service', parsed.serviceType);
  if (parsed.city) params.set('province', parsed.city);
  if (parsed.brandEn) params.set('brand', parsed.brandEn);

  const queryString = params.toString();
  return queryString ? `/workshops?${queryString}` : '/workshops';
}

// ── Build Parts Search URL ──
export function buildPartsSearchUrl(parsed: ParsedSearchQuery): string {
  const params = new URLSearchParams();

  const searchTerm = parsed.model || parsed.brand || '';
  if (searchTerm) params.set('search', searchTerm);
  if (parsed.brandEn) params.set('brand', parsed.brandEn);

  const queryString = params.toString();
  return queryString ? `/parts?${queryString}` : '/parts';
}

// ── Format Parsed Query as Human-Readable ──
export function formatParsedQuery(parsed: ParsedSearchQuery): string {
  const parts: string[] = [];

  if (parsed.brand) parts.push(parsed.brand);
  if (parsed.model) parts.push(parsed.model);
  if (parsed.year) {
    if (parsed.year.min === parsed.year.max) parts.push(`سنة ${parsed.year.min}`);
    else parts.push(`سنة ${parsed.year.min}-${parsed.year.max}`);
  }
  if (parsed.budget) parts.push(`حتى ${parsed.budget.toLocaleString()} د.أ`);
  if (parsed.city) parts.push(`في ${parsed.city}`);
  if (parsed.bodyType) parts.push(`نوع ${parsed.bodyType}`);
  if (parsed.fuelType) parts.push(`وقود ${parsed.fuelType}`);
  if (parsed.transmission) parts.push(parsed.transmission === 'AUTOMATIC' ? 'أوتوماتيك' : 'يدوي');
  if (parsed.kilometers) parts.push(`أقل من ${parsed.kilometers.max.toLocaleString()} كم`);

  return parts.length > 0 ? parts.join(' | ') : parsed.originalQuery;
}
