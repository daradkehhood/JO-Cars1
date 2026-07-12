export interface CarData {
  brand: string;
  model: string;
  year: number;
  trim?: string;
  kilometers: number;
  condition: string;
  fuelType: string;
  transmission: string;
  bodyType?: string;
  engineCapacity?: string;
  cylinders?: string;
  drivetrain?: string;
  color?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  isPaintOriginal?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isNegotiable?: boolean;
  price?: number;
  cityId?: string;
}

export interface PriceFactor {
  name: string;
  impact: number;
  description: string;
  icon: string;
}

export interface SimilarCar {
  id: string;
  title: string;
  price: number;
  year: number;
  kilometers: number;
  condition: string;
  city: string;
  image: string | null;
  similarity: number;
  source: string;
}

export interface PriceAnalysis {
  valuation: {
    fairPrice: number;
    minPrice: number;
    maxPrice: number;
    confidence: number;
    sources: string[];
  };
  assessment: {
    position: 'below' | 'within' | 'above';
    label: string;
    color: string;
    icon: string;
    diffPercent: number;
    diffAmount: number;
    explanation: string;
  };
  factors: PriceFactor[];
  similarCars: SimilarCar[];
  summary: {
    headline: string;
    detail: string;
    recommendation: string;
  };
}

const JORDAN_PRICES: Record<string, Record<number, number>> = {
  toyota: { 2026: 24000, 2025: 22000, 2024: 20000, 2023: 18000, 2022: 16500, 2021: 15000, 2020: 13500, 2019: 12000, 2018: 10500, 2017: 9500, 2016: 8500, 2015: 7500, 2014: 6500, 2013: 5500 },
  honda: { 2026: 22000, 2025: 20000, 2024: 18000, 2023: 16000, 2022: 14500, 2021: 13000, 2020: 11500, 2019: 10000, 2018: 9000, 2017: 8000, 2016: 7000, 2015: 6000, 2014: 5500, 2013: 5000 },
  hyundai: { 2026: 20000, 2025: 18000, 2024: 16000, 2023: 14000, 2022: 12500, 2021: 11000, 2020: 9500, 2019: 8500, 2018: 7500, 2017: 6500, 2016: 5500, 2015: 5000, 2014: 4500, 2013: 4000 },
  nissan: { 2026: 21000, 2025: 19000, 2024: 17000, 2023: 15000, 2022: 13500, 2021: 12000, 2020: 10500, 2019: 9000, 2018: 8000, 2017: 7000, 2016: 6000, 2015: 5500, 2014: 5000, 2013: 4500 },
  kia: { 2026: 19000, 2025: 17000, 2024: 15000, 2023: 13000, 2022: 11500, 2021: 10000, 2020: 8500, 2019: 7500, 2018: 6500, 2017: 5500, 2016: 5000, 2015: 4500, 2014: 4000, 2013: 3500 },
  mazda: { 2026: 23000, 2025: 21000, 2024: 19000, 2023: 17000, 2022: 15000, 2021: 13500, 2020: 12000, 2019: 10500, 2018: 9500, 2017: 8500, 2016: 7500, 2015: 6500, 2014: 5500, 2013: 5000 },
  ford: { 2026: 25000, 2025: 23000, 2024: 21000, 2023: 19000, 2022: 17000, 2021: 15000, 2020: 13000, 2019: 11500, 2018: 10000, 2017: 9000, 2016: 8000, 2015: 7000, 2014: 6000, 2013: 5500 },
  chevrolet: { 2026: 22000, 2025: 20000, 2024: 18000, 2023: 16000, 2022: 14000, 2021: 12500, 2020: 11000, 2019: 9500, 2018: 8500, 2017: 7500, 2016: 6500, 2015: 5500, 2014: 5000, 2013: 4500 },
  bmw: { 2026: 42000, 2025: 38000, 2024: 34000, 2023: 30000, 2022: 26000, 2021: 23000, 2020: 20000, 2019: 17000, 2018: 15000, 2017: 13000, 2016: 11000, 2015: 9500, 2014: 8000, 2013: 7000 },
  mercedes: { 2026: 45000, 2025: 40000, 2024: 36000, 2023: 32000, 2022: 28000, 2021: 25000, 2020: 22000, 2019: 19000, 2018: 16000, 2017: 14000, 2016: 12000, 2015: 10000, 2014: 8500, 2013: 7500 },
  audi: { 2026: 40000, 2025: 35000, 2024: 31000, 2023: 27000, 2022: 24000, 2021: 21000, 2020: 18000, 2019: 15500, 2018: 13500, 2017: 11500, 2016: 10000, 2015: 8500, 2014: 7500, 2013: 6500 },
  lexus: { 2026: 48000, 2025: 42000, 2024: 38000, 2023: 34000, 2022: 30000, 2021: 26000, 2020: 23000, 2019: 20000, 2018: 17000, 2017: 15000, 2016: 13000, 2015: 11000, 2014: 9500, 2013: 8000 },
  suzuki: { 2026: 14000, 2025: 12000, 2024: 10500, 2023: 9000, 2022: 8000, 2021: 7000, 2020: 6000, 2019: 5500, 2018: 5000, 2017: 4500, 2016: 4000, 2015: 3500, 2014: 3000, 2013: 2800 },
  mg: { 2026: 17000, 2025: 15000, 2024: 13000, 2023: 11000, 2022: 9500, 2021: 8000, 2020: 7000, 2019: 6000 },
  chery: { 2026: 16000, 2025: 14000, 2024: 12000, 2023: 10000, 2022: 8500, 2021: 7000, 2020: 6000, 2019: 5000 },
  geely: { 2026: 18000, 2025: 16000, 2024: 14000, 2023: 12000, 2022: 10500, 2021: 9000, 2020: 7500, 2019: 6500 },
  byd: { 2026: 28000, 2025: 25000, 2024: 22000, 2023: 19000, 2022: 16000, 2021: 14000, 2020: 12000, 2019: 10000 },
  haval: { 2026: 22000, 2025: 20000, 2024: 18000, 2023: 16000, 2022: 14000, 2021: 12000, 2020: 10000 },
  dfsk: { 2026: 15000, 2025: 13000, 2024: 11000, 2023: 9500, 2022: 8000, 2021: 7000, 2020: 6000 },
  mitsubishi: { 2026: 20000, 2025: 18000, 2024: 16000, 2023: 14000, 2022: 12000, 2021: 10500, 2020: 9000, 2019: 8000, 2018: 7000, 2017: 6000, 2016: 5500, 2015: 5000 },
  jeep: { 2026: 30000, 2025: 27000, 2024: 24000, 2023: 21000, 2022: 18000, 2021: 16000, 2020: 14000, 2019: 12000, 2018: 10500, 2017: 9000, 2016: 8000, 2015: 7000 },
};

const MODEL_ADJUSTMENTS: Record<string, Record<string, number>> = {
  toyota: { 'corolla': 0, 'camry': 0.15, 'rav4': 0.25, 'land cruiser': 0.80, 'prado': 0.50, 'hilux': 0.30, 'yaris': -0.15, 'avalon': 0.20, 'fortuner': 0.35, 'highlander': 0.40, 'land cruiser prado': 0.50 },
  honda: { 'civic': 0, 'accord': 0.10, 'crv': 0.20, 'hrv': 0.05, 'pilot': 0.35, 'city': -0.10, 'jazz': -0.15 },
  hyundai: { 'accent': -0.10, 'elantra': 0, 'sonata': 0.15, 'tucson': 0.20, 'santa fe': 0.35, 'i10': -0.20, 'i20': -0.15, 'kona': 0.10, 'palisade': 0.50, 'bayon': 0.05 },
  nissan: { 'sunny': -0.10, 'sentra': 0, 'altima': 0.15, 'xtrail': 0.20, 'patrol': 0.80, 'kicks': 0.05, 'qashqai': 0.15, 'navara': 0.25, 'tiida': -0.05 },
  kia: { 'rio': -0.10, 'cerato': 0, 'optima': 0.10, 'sportage': 0.20, 'sorento': 0.35, 'picanto': -0.20, 'stonic': 0.05, 'sonet': 0.05, 'telluride': 0.55 },
  mazda: { '2': -0.15, '3': 0, '6': 0.10, 'cx3': 0.05, 'cx5': 0.20, 'cx9': 0.40, 'cx30': 0.10 },
  ford: { 'fiesta': -0.15, 'focus': 0, 'escape': 0.20, 'explorer': 0.40, 'ranger': 0.30, 'everest': 0.35, 'mustang': 0.50, 'bronco': 0.45 },
  chevrolet: { 'spark': -0.20, 'cobalt': -0.10, 'cruze': 0, 'malibu': 0.10, 'tahoe': 0.60, 'trailblazer': 0.25, 'colorado': 0.30, 'silverado': 0.50, 'traverse': 0.35 },
  bmw: { '1 series': -0.15, '3 series': 0, '5 series': 0.20, '7 series': 0.50, 'x1': 0.10, 'x3': 0.25, 'x5': 0.45, 'x7': 0.70, 'x6': 0.50, 'z4': 0.30 },
  mercedes: { 'a class': -0.10, 'c class': 0, 'e class': 0.20, 's class': 0.50, 'gla': 0.10, 'glc': 0.25, 'gle': 0.40, 'gls': 0.60, 'amg': 0.45 },
  audi: { 'a1': -0.15, 'a3': -0.05, 'a4': 0, 'a6': 0.20, 'a8': 0.50, 'q3': 0.10, 'q5': 0.25, 'q7': 0.40, 'q8': 0.55, 'tt': 0.20 },
  lexus: { 'is': 0, 'es': 0.10, 'gs': 0.15, 'ls': 0.40, 'nx': 0.15, 'rx': 0.30, 'gx': 0.45, 'lx': 0.70, 'ux': 0.05 },
  suzuki: { 'swift': -0.10, 'alto': -0.25, 'dzire': -0.15, 'vitara': 0.05, 'jimny': 0.15, 'ertiga': 0, 'baleno': -0.05 },
};

const TRANSMISSION_FACTORS: Record<string, number> = {
  'AUTOMATIC': 0.03, 'A': 0.03,
  'CVT': 0.02,
  'DCT': 0.04,
  'MANUAL': -0.02, 'M': -0.02,
  'SEMI_AUTOMATIC': 0.01,
};

const FUEL_FACTORS: Record<string, number> = {
  'PETROL': 0, 'B': 0,
  'DIESEL': 0.05, 'D': 0.05,
  'HYBRID': 0.10, 'H': 0.10,
  'ELECTRIC': 0.15, 'E': 0.15,
  'PLUGIN_HYBRID': 0.12,
};

const BODY_TYPE_FACTORS: Record<string, number> = {
  'SUV': 0.10,
  'SEDAN': 0,
  'HATCHBACK': -0.05,
  'COUPE': 0.05,
  'CONVERTIBLE': 0.08,
  'WAGON': -0.03,
  'PICKUP': 0.12,
  'VAN': -0.05,
  'MINIVAN': 0.02,
};

const CONDITION_FACTORS: Record<string, number> = {
  'ممتازة': 0.15, 'EXCELLENT': 0.15,
  'جيدة جداً': 0.05, 'VERY_GOOD': 0.05,
  'جيدة': -0.05, 'GOOD': -0.05,
  'مقبولة': -0.15, 'FAIR': -0.15,
  'تحتاج صيانة': -0.25, 'NEEDS_MAINTENANCE': -0.25,
  'تحتاج فحص': -0.30, 'NEEDS_INSPECTION': -0.30,
};

function normalizeBrand(brand: string): string {
  const lower = brand.toLowerCase().trim();
  const aliases: Record<string, string> = {
    'ttoyota': 'toyota', 'toyta': 'toyota', 'تويوتا': 'toyota',
    'honda': 'honda', 'هوندا': 'honda', 'هوندي': 'honda',
    'hyundai': 'hyundai', 'هيونداي': 'hyundai', 'هيونداى': 'hyundai',
    'nissan': 'nissan', 'نيسان': 'nissan', 'نسن': 'nissan',
    'kia': 'kia', 'كيا': 'kia',
    'mazda': 'mazda', 'مازدا': 'mazda',
    'ford': 'ford', 'فورد': 'ford',
    'chevrolet': 'chevrolet', 'شفروليت': 'chevrolet', 'شفروليه': 'chevrolet',
    'bmw': 'bmw', 'بي ام': 'bmw', 'بي ام دبليو': 'bmw',
    'mercedes': 'mercedes', 'مرسيدس': 'mercedes', 'بنز': 'mercedes',
    'audi': 'audi', 'اودي': 'audi', 'أودي': 'audi',
    'lexus': 'lexus', 'لكزس': 'lexus',
    'suzuki': 'suzuki', 'سوزوكي': 'suzuki',
    'mg': 'mg', 'ام جي': 'mg', 'إم جي': 'mg',
    'chery': 'chery', 'شيري': 'chery',
    'geely': 'geely', 'جيلي': 'geely',
    'byd': 'byd', 'بي واي دي': 'byd',
    'haval': 'haval', 'هافال': 'haval',
    'dfsk': 'dfsk', 'دي اف اس كي': 'dfsk',
    'mitsubishi': 'mitsubishi', 'ميتسوبيشي': 'mitsubishi',
    'jeep': 'jeep', 'جيب': 'jeep',
  };
  return aliases[lower] || lower;
}

function getModelAdjustment(brand: string, model: string): number {
  const normalized = normalizeBrand(brand);
  const modelLower = model.toLowerCase().trim();
  const brandModels = MODEL_ADJUSTMENTS[normalized];
  if (!brandModels) return 0;
  for (const [key, adj] of Object.entries(brandModels)) {
    if (modelLower.includes(key)) return adj;
  }
  return 0;
}

function calculateBasePrice(brand: string, model: string, year: number): number {
  const normalized = normalizeBrand(brand);
  const brandPrices = JORDAN_PRICES[normalized];
  if (!brandPrices) return 15000;

  const years = Object.keys(brandPrices).map(Number).sort((a, b) => b - a);
  let base = 0;

  if (year >= years[0]) {
    base = brandPrices[years[0]] * 1.05;
  } else if (year <= years[years.length - 1]) {
    base = brandPrices[years[years.length - 1]] * 0.7;
  } else {
    for (let i = 0; i < years.length - 1; i++) {
      if (year <= years[i] && year >= years[i + 1]) {
        const ratio = (years[i] - year) / (years[i] - years[i + 1]);
        base = brandPrices[years[i]] + ratio * (brandPrices[years[i + 1]] - brandPrices[years[i]]);
        break;
      }
    }
  }
  if (base === 0) base = brandPrices[years[0]] || 15000;

  const modelAdj = getModelAdjustment(brand, model);
  base *= (1 + modelAdj);

  return Math.round(base);
}

function analyzeFactors(car: CarData, basePrice: number): PriceFactor[] {
  const factors: PriceFactor[] = [];

  const age = new Date().getFullYear() - car.year;
  let ageFactor = 0;
  if (age === 0) ageFactor = 0.05;
  else if (age === 1) ageFactor = 0.03;
  else if (age <= 3) ageFactor = 0.01;
  else if (age >= 10) ageFactor = -0.05;
  else if (age >= 8) ageFactor = -0.03;
  factors.push({
    name: 'سنة الصنع',
    impact: ageFactor,
    description: age === 0 ? 'سيارة جديدة — ميزة كبيرة' : age <= 2 ? `سيارة حديثة (${age} سنوات) — ممتاز` : age <= 5 ? `عمرها ${age} سنوات — لا تزال جيدة` : age <= 7 ? `عمرها ${age} سنوات — مقبولة` : `قديمة نسبياً (${age} سنة)`,
    icon: 'calendar',
  });

  const expectedKm = age * 20000;
  let kmFactor = 0;
  if (expectedKm > 0) {
    const kmRatio = car.kilometers / expectedKm;
    if (kmRatio > 1.5) kmFactor = -0.20;
    else if (kmRatio > 1.3) kmFactor = -0.12;
    else if (kmRatio > 1.1) kmFactor = -0.05;
    else if (kmRatio < 0.3) kmFactor = 0.10;
    else if (kmRatio < 0.5) kmFactor = 0.06;
    else if (kmRatio < 0.8) kmFactor = 0.03;
  }
  factors.push({
    name: 'عداد الكيلومترات',
    impact: kmFactor,
    description: car.kilometers === 0 ? 'لم يتم تحديد الكيلومترات' :
      car.kilometers < 10000 ? 'كم منخفض جداً — ممتاز' :
      car.kilometers < 30000 ? 'كم منخفض — جيد جداً' :
      car.kilometers < 60000 ? 'كم متوسط — مقبول' :
      car.kilometers < 100000 ? 'كم مرتفع — يحتاج انتباه' :
      'كم عالي جداً — تأثير كبير على السعر',
    icon: 'gauge',
  });

  const condFactor = CONDITION_FACTORS[car.condition] || 0;
  const condLabel = car.condition.includes('ممتاز') ? 'ممتازة' :
    car.condition.includes('جيدة جدا') ? 'جيدة جداً' :
    car.condition.includes('جيدة') ? 'جيدة' :
    car.condition.includes('مقبولة') ? 'مقبولة' : car.condition;
  factors.push({
    name: 'حالة السيارة',
    impact: condFactor,
    description: `حالة ${condLabel} ${condFactor > 0 ? '— ميزة إيجابية' : condFactor < 0 ? '— تقلل من السعر' : ''}`,
    icon: 'shield',
  });

  const fuelFactor = FUEL_FACTORS[car.fuelType] || 0;
  if (fuelFactor !== 0) {
    const fuelLabel = car.fuelType === 'DIESEL' ? 'ديزل' :
      car.fuelType === 'HYBRID' ? 'هايبرد' :
      car.fuelType === 'ELECTRIC' ? 'كهرباء' :
      car.fuelType === 'PLUGIN_HYBRID' ? 'هايبرد بلج إن' : 'بنزين';
    factors.push({
      name: 'نوع الوقود',
      impact: fuelFactor,
      description: `${fuelLabel} ${fuelFactor > 0 ? '— أكثر طلباً في السوق' : ''}`,
      icon: 'fuel',
    });
  }

  const transFactor = TRANSMISSION_FACTORS[car.transmission] || 0;
  if (transFactor !== 0) {
    const transLabel = car.transmission === 'AUTOMATIC' || car.transmission === 'A' ? 'أوتوماتيك' :
      car.transmission === 'CVT' ? 'CVT' :
      car.transmission === 'DCT' ? 'DCT' : 'يدوي';
    factors.push({
      name: 'ناقل الحركة',
      impact: transFactor,
      description: `${transLabel} ${transFactor > 0 ? '— مفضل في السوق' : ''}`,
      icon: 'settings',
    });
  }

  if (car.bodyType) {
    const bodyFactor = BODY_TYPE_FACTORS[car.bodyType] || 0;
    if (bodyFactor !== 0) {
      const bodyLabels: Record<string, string> = {
        'SUV': 'SUV', 'SEDAN': 'سيدان', 'HATCHBACK': 'هاتشباك',
        'COUPE': 'كوبيه', 'CONVERTIBLE': 'كابريو', 'PICKUP': 'بيك أب',
        'VAN': 'فان', 'MINIVAN': 'ميني فان', 'WAGON': 'واجون',
      };
      factors.push({
        name: 'نوع الهيكل',
        impact: bodyFactor,
        description: `${bodyLabels[car.bodyType] || car.bodyType} ${bodyFactor > 0 ? '— مطلوب أكثر' : ''}`,
        icon: 'car',
      });
    }
  }

  if (car.isDamaged) {
    factors.push({
      name: 'مصدوم سابقاً',
      impact: -0.20,
      description: 'سيارة مصدومة سابقاً — تقلل السعر بشكل ملحوظ',
      icon: 'alert',
    });
  }

  if (car.ownerCount && car.ownerCount > 1) {
    const ownerFactor = -(car.ownerCount - 1) * 0.03;
    factors.push({
      name: 'عدد الملاك',
      impact: Math.max(-0.15, ownerFactor),
      description: `${car.ownerCount} ملاك — ${car.ownerCount === 2 ? 'مقبول' : car.ownerCount <= 3 ? 'ملاحظة' : 'تأثير سلبي'}`,
      icon: 'users',
    });
  }

  if (car.hasWarranty) {
    factors.push({
      name: 'ضمان',
      impact: 0.03,
      description: 'السيارة تحت الضمان — ميزة إضافية',
      icon: 'check',
    });
  }

  if (car.hasServiceHistory) {
    factors.push({
      name: 'سجل صيانة',
      impact: 0.05,
      description: 'سجل صيانة كامل — يزيد الثقة والقيمة',
      icon: 'clipboard',
    });
  }

  if (car.isPaintOriginal === false) {
    factors.push({
      name: 'الدهان غير أصلي',
      impact: -0.05,
      description: 'تم طلاؤها — قد يدل على خدوش أو حادث',
      icon: 'palette',
    });
  }

  return factors;
}

function calculateSimilarityScore(car: CarData, candidate: {
  brand?: string; model?: string; year: number; kilometers: number;
  condition?: string; fuelType?: string; transmission?: string;
}): number {
  let score = 0;
  let maxScore = 0;

  maxScore += 25;
  if (candidate.brand && normalizeBrand(candidate.brand) === normalizeBrand(car.brand)) score += 25;

  maxScore += 25;
  if (candidate.model && car.model) {
    const candModel = candidate.model.toLowerCase();
    const carModel = car.model.toLowerCase();
    if (candModel === carModel) score += 25;
    else if (candModel.includes(carModel) || carModel.includes(candModel)) score += 15;
  }

  maxScore += 20;
  const yearDiff = Math.abs(candidate.year - car.year);
  if (yearDiff === 0) score += 20;
  else if (yearDiff === 1) score += 15;
  else if (yearDiff === 2) score += 10;
  else if (yearDiff <= 3) score += 5;

  maxScore += 15;
  if (car.kilometers > 0 && candidate.kilometers > 0) {
    const kmDiff = Math.abs(candidate.kilometers - car.kilometers) / Math.max(car.kilometers, 1);
    if (kmDiff < 0.1) score += 15;
    else if (kmDiff < 0.2) score += 10;
    else if (kmDiff < 0.3) score += 5;
  }

  maxScore += 10;
  if (candidate.fuelType && car.fuelType && candidate.fuelType === car.fuelType) score += 10;

  maxScore += 5;
  if (candidate.transmission && car.transmission && candidate.transmission === car.transmission) score += 5;

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

async function getDbSimilarCars(car: CarData): Promise<SimilarCar[]> {
  try {
    const { default: prisma } = await import('@/lib/prisma');

    const where: Record<string, unknown> = {
      status: 'APPROVED',
      price: { gt: 0 },
      year: { gte: car.year - 3, lte: car.year + 3 },
    };

    if (car.brand) {
      where.OR = [
        { brand: { nameAr: { contains: car.brand } } },
        { brand: { nameEn: { contains: car.brand } } },
      ];
    }

    const cars = await prisma.car.findMany({
      where,
      take: 30,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, slug: true, price: true, year: true, kilometers: true,
        condition: true, fuelType: true, transmission: true, bodyType: true,
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        city: { select: { nameAr: true } },
        images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
      },
    });

    return cars
      .map(c => ({
        id: c.id,
        title: `${c.brand?.nameAr || ''} ${c.model?.nameAr || ''} ${c.year}`,
        price: c.price,
        year: c.year,
        kilometers: c.kilometers,
        condition: c.condition,
        city: c.city?.nameAr || '',
        image: c.images?.[0]?.url || null,
        similarity: calculateSimilarityScore(car, {
          brand: c.brand?.nameAr || c.brand?.nameEn,
          model: c.model?.nameAr || c.model?.nameEn,
          year: c.year,
          kilometers: c.kilometers,
          condition: c.condition,
          fuelType: c.fuelType,
          transmission: c.transmission,
        }),
        source: 'JO Cars',
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  } catch {
    return [];
  }
}

function calculateFairPrice(car: CarData, basePrice: number, factors: PriceFactor[]): {
  fairPrice: number;
  minPrice: number;
  maxPrice: number;
} {
  let totalImpact = 0;
  for (const factor of factors) {
    totalImpact += factor.impact;
  }
  totalImpact = Math.max(-0.50, Math.min(0.50, totalImpact));

  const adjustedPrice = basePrice * (1 + totalImpact);
  const fairPrice = Math.round(adjustedPrice);
  const minPrice = Math.round(fairPrice * 0.85);
  const maxPrice = Math.round(fairPrice * 1.15);

  return { fairPrice, minPrice, maxPrice };
}

function generateAssessment(
  userPrice: number,
  fairPrice: number,
  minPrice: number,
  maxPrice: number,
  factors: PriceFactor[]
): PriceAnalysis['assessment'] {
  if (!userPrice || userPrice === 0) {
    return {
      position: 'within',
      label: 'لم يتم تحديد السعر بعد',
      color: 'text-gray-500',
      icon: 'info',
      diffPercent: 0,
      diffAmount: 0,
      explanation: 'يمكنك استخدام السعر العادل المقترح كنقطة بداية.',
    };
  }

  const diffPercent = fairPrice > 0 ? Math.round(((userPrice - fairPrice) / fairPrice) * 100) : 0;
  const diffAmount = userPrice - fairPrice;

  const topFactors = [...factors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 3);
  const factorExplanations = topFactors.map(f => {
    if (f.impact > 0) return `(${f.name} يزيد القيمة)`;
    if (f.impact < 0) return `(${f.name} يقلل القيمة)`;
    return `(${f.name} محايد)`;
  }).join(' ');

  if (diffPercent < -10) {
    return {
      position: 'below',
      label: 'أقل من القيمة السوقية',
      color: 'text-green-600',
      icon: 'trending-down',
      diffPercent,
      diffAmount,
      explanation: `سعرك أقل بـ ${Math.abs(diffPercent)}% من القيمة العادلة ${factorExplanations}. قد يكون جذاباً للمشترين لكنه أقل من القيمة الحقيقية.`,
    };
  }

  if (diffPercent <= 10) {
    return {
      position: 'within',
      label: 'ضمن السعر العادل',
      color: 'text-blue-600',
      icon: 'check-circle',
      diffPercent,
      diffAmount,
      explanation: `سعرك في نطاق السعر العادل ${factorExplanations}. هذا سعر مناسب للسوق.`,
    };
  }

  return {
    position: 'above',
    label: 'أعلى من القيمة السوقية',
    color: 'text-red-600',
    icon: 'trending-up',
    diffPercent,
    diffAmount,
    explanation: `سعرك أعلى بـ ${diffPercent}% من القيمة العادلة ${factorExplanations}. قد يصعب البيع بهذا السعر.`,
  };
}

function generateSummary(
  car: CarData,
  fairPrice: number,
  assessment: PriceAnalysis['assessment'],
  similarCount: number
): PriceAnalysis['summary'] {
  const carName = `${car.brand} ${car.model} ${car.year}`;

  const headline = assessment.position === 'below'
    ? `${carName} — سعر أقل من السوق`
    : assessment.position === 'within'
    ? `${carName} — سعر عادل ومناسب`
    : `${carName} — سعر أعلى من السوق`;

  const detail = `بناءً على تحليل ${similarCount} إعلان مشابه وبيانات السوق الأردني، السعر العادل المقدر هو ${fairPrice.toLocaleString()} د.أ. ${assessment.explanation}`;

  const recommendation = assessment.position === 'below'
    ? `يمكنك رفع السعر إلى ${fairPrice.toLocaleString()} د.أ للحصول على قيمة أفضل.`
    : assessment.position === 'within'
    ? 'سعرك مناسب ويمكنك المتابعة بالإعلان.'
    : `يُنصح بخفض السعر إلى ${fairPrice.toLocaleString()} د.أ لزيادة فرص البيع.`;

  return { headline, detail, recommendation };
}

export async function analyzeCarPrice(car: CarData): Promise<PriceAnalysis> {
  const basePrice = calculateBasePrice(car.brand, car.model, car.year);
  const factors = analyzeFactors(car, basePrice);
  const { fairPrice, minPrice, maxPrice } = calculateFairPrice(car, basePrice, factors);

  const similarCars = await getDbSimilarCars(car);
  const dbPrices = similarCars.map(c => c.price).filter(p => p > 0);
  const dbAvg = dbPrices.length > 0 ? Math.round(dbPrices.reduce((a, b) => a + b, 0) / dbPrices.length) : 0;

  let finalFairPrice = fairPrice;
  let confidence = 60;
  const sources: string[] = ['تحليل ذكي'];

  if (dbPrices.length >= 3) {
    finalFairPrice = Math.round(fairPrice * 0.5 + dbAvg * 0.5);
    confidence = 85;
    sources.push(`JO Cars (${dbPrices.length} إعلان مشابه)`);
  } else if (dbPrices.length >= 1) {
    finalFairPrice = Math.round(fairPrice * 0.7 + dbAvg * 0.3);
    confidence = 72;
    sources.push(`JO Cars (${dbPrices.length} إعلان)`);
  }

  const assessment = generateAssessment(car.price || 0, finalFairPrice, minPrice, maxPrice, factors);
  const summary = generateSummary(car, finalFairPrice, assessment, similarCars.length);

  return {
    valuation: {
      fairPrice: finalFairPrice,
      minPrice: Math.round(finalFairPrice * 0.85),
      maxPrice: Math.round(finalFairPrice * 1.15),
      confidence: Math.min(95, confidence),
      sources,
    },
    assessment,
    factors,
    similarCars,
    summary,
  };
}
