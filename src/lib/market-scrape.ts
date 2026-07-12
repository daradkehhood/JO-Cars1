export interface MarketPrice {
  source: string;
  title: string;
  price: number;
  year: number;
  km: number;
  url: string;
  location: string;
}

export interface MarketStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
  sources: string[];
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
  mistubishi: { 2026: 20000, 2025: 18000, 2024: 16000, 2023: 14000, 2022: 12000, 2021: 10500, 2020: 9000, 2019: 8000, 2018: 7000, 2017: 6000, 2016: 5500, 2015: 5000 },
  jeep: { 2026: 30000, 2025: 27000, 2024: 24000, 2023: 21000, 2022: 18000, 2021: 16000, 2020: 14000, 2019: 12000, 2018: 10500, 2017: 9000, 2016: 8000, 2015: 7000 },
};

const MODEL_ADJUSTMENTS: Record<string, Record<string, number>> = {
  toyota: { 'corolla': 0, 'camry': 0.15, 'rav4': 0.25, 'land cruiser': 0.80, 'prado': 0.50, 'hilux': 0.30, 'yaris': -0.15, 'avalon': 0.20, 'fortuner': 0.35, 'highlander': 0.40 },
  honda: { 'civic': 0, 'accord': 0.10, 'crv': 0.20, 'hrv': 0.05, 'pilot': 0.35, 'city': -0.10 },
  hyundai: { 'accent': -0.10, 'elantra': 0, 'sonata': 0.15, 'tucson': 0.20, 'santa fe': 0.35, 'i10': -0.20, 'i20': -0.15, 'kona': 0.10, 'palisade': 0.50 },
  nissan: { 'sunny': -0.10, 'sentra': 0, 'altima': 0.15, 'xtrail': 0.20, 'patrol': 0.80, 'kicks': 0.05, 'qashqai': 0.15, 'navara': 0.25 },
  kia: { 'rio': -0.10, 'cerato': 0, 'optima': 0.10, 'sportage': 0.20, 'sorento': 0.35, 'picanto': -0.20, 'stonic': 0.05, 'sonet': 0.05 },
  mazda: { '2': -0.15, '3': 0, '6': 0.10, 'cx3': 0.05, 'cx5': 0.20, 'cx9': 0.40 },
  ford: { 'fiesta': -0.15, 'focus': 0, 'escape': 0.20, 'explorer': 0.40, 'ranger': 0.30, 'everest': 0.35, 'mustang': 0.50 },
  chevrolet: { 'spark': -0.20, 'cobalt': -0.10, 'cruze': 0, 'malibu': 0.10, 'tahoe': 0.60, 'trailblazer': 0.25, 'colorado': 0.30, 'silverado': 0.50 },
  bmw: { '1 series': -0.15, '3 series': 0, '5 series': 0.20, '7 series': 0.50, 'x1': 0.10, 'x3': 0.25, 'x5': 0.45, 'x7': 0.70 },
  mercedes: { 'a class': -0.10, 'c class': 0, 'e class': 0.20, 's class': 0.50, 'gla': 0.10, 'glc': 0.25, 'gle': 0.40, 'gls': 0.60 },
  audi: { 'a1': -0.15, 'a3': -0.05, 'a4': 0, 'a6': 0.20, 'a8': 0.50, 'q3': 0.10, 'q5': 0.25, 'q7': 0.40, 'q8': 0.55 },
  lexus: { 'is': 0, 'es': 0.10, 'gs': 0.15, 'ls': 0.40, 'nx': 0.15, 'rx': 0.30, 'gx': 0.45, 'lx': 0.70 },
  suzuki: { 'swift': -0.10, 'alto': -0.25, 'dzire': -0.15, 'vitara': 0.05, 'jimny': 0.15, 'ertiga': 0 },
};

const CONDITION_MULTIPLIERS: Record<string, number> = {
  'ممتازة': 1.15, 'EXCELLENT': 1.15,
  'جيدة جداً': 1.05, 'VERY_GOOD': 1.05,
  'جيدة': 0.95, 'GOOD': 0.95,
  'مقبولة': 0.85, 'FAIR': 0.85,
  'سيئة': 0.70, 'POOR': 0.70,
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
    'chevrolet': 'chevrolet', 'شفروليت': 'chevrolet', 'شفروليه': 'chevrolet', 'شفرولية': 'chevrolet',
    'bmw': 'bmw', 'بي ام': 'bmw', 'بي ام دبليو': 'bmw', 'ب ام': 'bmw',
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
    'mitsubishi': 'mitsubishi', 'ميتسوبيشي': 'mitsubishi', 'ميتسبيشي': 'mitsubishi',
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

function estimatePrice(brand: string, model: string, year: number, km: number, condition: string): number {
  const normalized = normalizeBrand(brand);
  const brandPrices = JORDAN_PRICES[normalized];

  let basePrice = 15000;

  if (brandPrices) {
    const years = Object.keys(brandPrices).map(Number).sort((a, b) => b - a);

    if (year >= years[0]) {
      basePrice = brandPrices[years[0]] * 1.05;
    } else if (year <= years[years.length - 1]) {
      basePrice = brandPrices[years[years.length - 1]] * 0.7;
    } else {
      for (let i = 0; i < years.length - 1; i++) {
        if (year <= years[i] && year >= years[i + 1]) {
          const ratio = (years[i] - year) / (years[i] - years[i + 1]);
          basePrice = brandPrices[years[i]] + ratio * (brandPrices[years[i + 1]] - brandPrices[years[i]]);
          break;
        }
      }
    }
  }

  const modelAdj = getModelAdjustment(brand, model);
  basePrice *= (1 + modelAdj);

  const age = new Date().getFullYear() - year;
  const expectedKm = age * 20000;
  if (expectedKm > 0) {
    const kmRatio = km / expectedKm;
    if (kmRatio > 1.5) basePrice *= 0.80;
    else if (kmRatio > 1.3) basePrice *= 0.85;
    else if (kmRatio > 1.1) basePrice *= 0.92;
    else if (kmRatio < 0.3) basePrice *= 1.12;
    else if (kmRatio < 0.5) basePrice *= 1.08;
    else if (kmRatio < 0.8) basePrice *= 1.03;
  }

  const conditionMult = CONDITION_MULTIPLIERS[condition] || 0.95;
  basePrice *= conditionMult;

  return Math.round(basePrice);
}

function calculateStats(prices: number[]): MarketStats {
  if (prices.length === 0) return { min: 0, max: 0, avg: 0, median: 0, count: 0, sources: [] };
  const sorted = [...prices].sort((a, b) => a - b);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return { min: sorted[0], max: sorted[sorted.length - 1], avg, median, count: prices.length, sources: [] };
}

async function getDbPrices(brand: string, model: string, year: number): Promise<number[]> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const yearRange = 2;
    const where: Record<string, unknown> = {
      status: 'APPROVED',
      year: { gte: year - yearRange, lte: year + yearRange },
      price: { gt: 0 },
    };

    if (brand) {
      where.OR = [
        { brand: { nameAr: { contains: brand } } },
        { brand: { nameEn: { contains: brand } } },
      ];
    }

    let cars = await prisma.car.findMany({
      where,
      take: 50,
      select: { price: true, model: { select: { nameAr: true, nameEn: true } } },
    });

    if (model && cars.length >= 3) {
      const filtered = cars.filter(c =>
        (c.model?.nameAr || '').includes(model) || (c.model?.nameEn || '').includes(model)
      );
      if (filtered.length >= 3) cars = filtered;
    }

    return cars.map(c => c.price).filter(p => p > 0);
  } catch {
    return [];
  }
}

export async function getMarketPrices(
  brand: string,
  model: string,
  year: number,
  km: number,
  condition: string
): Promise<{
  stats: MarketStats;
  webPrices: MarketPrice[];
  dbPrices: { min: number; max: number; avg: number; median: number; count: number };
  estimatedPrice: number;
  priceLabel: { label: string; color: string; icon: string };
}> {
  const estimatedPrice = estimatePrice(brand, model, year, km, condition);

  const dbPrices = await getDbPrices(brand, model, year);
  const dbStats = calculateStats(dbPrices);

  const allPrices = [...dbPrices, estimatedPrice];
  const combinedStats = calculateStats(allPrices);

  const sources: string[] = ['تحليل ذكي'];
  if (dbStats.count > 0) sources.push('JO Cars');

  const diff = dbStats.avg > 0 ? ((estimatedPrice - dbStats.avg) / dbStats.avg) * 100 : 0;

  let priceLabel: { label: string; color: string; icon: string };
  if (dbStats.count === 0) {
    priceLabel = { label: 'تقييم بناءً على بيانات السوق الأردني', color: 'text-blue-500', icon: 'info' };
  } else if (diff < -10) {
    priceLabel = { label: 'أقل من السوق', color: 'text-green-500', icon: 'trending-down' };
  } else if (diff < 5) {
    priceLabel = { label: 'سعر السوق', color: 'text-blue-500', icon: 'check-circle' };
  } else if (diff < 15) {
    priceLabel = { label: 'أعلى من السوق', color: 'text-amber-500', icon: 'trending-up' };
  } else {
    priceLabel = { label: 'غالي مقارنة بالسوق', color: 'text-red-500', icon: 'alert-triangle' };
  }

  const webPrices: MarketPrice[] = [];
  if (dbStats.count > 0) {
    webPrices.push({
      source: 'JO Cars',
      title: `متوسط إعلانات JO Cars (${dbStats.count} إعلان)`,
      price: dbStats.avg,
      year,
      km,
      url: '/cars',
      location: 'الأردن',
    });
  }
  webPrices.push({
    source: 'تحليل ذكي',
    title: `تقييم ${brand} ${model} ${year}`,
    price: estimatedPrice,
    year,
    km,
    url: '',
    location: 'الأردن',
  });

  return {
    stats: { ...combinedStats, sources },
    webPrices,
    dbPrices: {
      min: dbStats.min || estimatedPrice,
      max: dbStats.max || estimatedPrice,
      avg: dbStats.avg || estimatedPrice,
      median: dbStats.median || estimatedPrice,
      count: dbStats.count,
    },
    estimatedPrice,
    priceLabel,
  };
}
