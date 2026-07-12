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

const JORDAN_BASE_PRICES: Record<string, Record<number, number>> = {
  toyota: { 2025: 22000, 2024: 20000, 2023: 18000, 2022: 16500, 2021: 15000, 2020: 13500, 2019: 12000, 2018: 10500, 2017: 9500, 2016: 8500, 2015: 7500 },
  honda: { 2025: 20000, 2024: 18000, 2023: 16000, 2022: 14500, 2021: 13000, 2020: 11500, 2019: 10000, 2018: 9000, 2017: 8000, 2016: 7000, 2015: 6000 },
  hyundai: { 2025: 18000, 2024: 16000, 2023: 14000, 2022: 12500, 2021: 11000, 2020: 9500, 2019: 8500, 2018: 7500, 2017: 6500, 2016: 5500, 2015: 5000 },
  nissan: { 2025: 19000, 2024: 17000, 2023: 15000, 2022: 13500, 2021: 12000, 2020: 10500, 2019: 9000, 2018: 8000, 2017: 7000, 2016: 6000, 2015: 5500 },
  kia: { 2025: 17000, 2024: 15000, 2023: 13000, 2022: 11500, 2021: 10000, 2020: 8500, 2019: 7500, 2018: 6500, 2017: 5500, 2016: 5000, 2015: 4500 },
  mazda: { 2025: 21000, 2024: 19000, 2023: 17000, 2022: 15000, 2021: 13500, 2020: 12000, 2019: 10500, 2018: 9500, 2017: 8500, 2016: 7500, 2015: 6500 },
  ford: { 2025: 23000, 2024: 21000, 2023: 19000, 2022: 17000, 2021: 15000, 2020: 13000, 2019: 11500, 2018: 10000, 2017: 9000, 2016: 8000, 2015: 7000 },
  chevrolet: { 2025: 20000, 2024: 18000, 2023: 16000, 2022: 14000, 2021: 12500, 2020: 11000, 2019: 9500, 2018: 8500, 2017: 7500, 2016: 6500, 2015: 5500 },
  bmw: { 2025: 38000, 2024: 34000, 2023: 30000, 2022: 26000, 2021: 23000, 2020: 20000, 2019: 17000, 2018: 15000, 2017: 13000, 2016: 11000, 2015: 9500 },
  mercedes: { 2025: 40000, 2024: 36000, 2023: 32000, 2022: 28000, 2021: 25000, 2020: 22000, 2019: 19000, 2018: 16000, 2017: 14000, 2016: 12000, 2015: 10000 },
  audi: { 2025: 35000, 2024: 31000, 2023: 27000, 2022: 24000, 2021: 21000, 2020: 18000, 2019: 15500, 2018: 13500, 2017: 11500, 2016: 10000, 2015: 8500 },
  lexus: { 2025: 42000, 2024: 38000, 2023: 34000, 2022: 30000, 2021: 26000, 2020: 23000, 2019: 20000, 2018: 17000, 2017: 15000, 2016: 13000, 2015: 11000 },
  suzuki: { 2025: 12000, 2024: 10500, 2023: 9000, 2022: 8000, 2021: 7000, 2020: 6000, 2019: 5500, 2018: 5000, 2017: 4500, 2016: 4000, 2015: 3500 },
  mg: { 2025: 15000, 2024: 13000, 2023: 11000, 2022: 9500, 2021: 8000, 2020: 7000 },
  chery: { 2025: 14000, 2024: 12000, 2023: 10000, 2022: 8500, 2021: 7000, 2020: 6000 },
  geely: { 2025: 16000, 2024: 14000, 2023: 12000, 2022: 10500, 2021: 9000, 2020: 7500 },
  byd: { 2025: 25000, 2024: 22000, 2023: 19000, 2022: 16000, 2021: 14000, 2020: 12000 },
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
    'chevrolet': 'chevrolet', 'شفروليت': 'chevrolet', 'شفروليه': 'chevrolet',
    'bmw': 'bmw', 'بي ام': 'bmw', 'بي ام دبليو': 'bmw',
    'mercedes': 'mercedes', 'مرسيدس': 'mercedes',
    'audi': 'audi', 'اودي': 'audi', 'أودي': 'audi',
    'lexus': 'lexus', 'لكزس': 'lexus', 'لكزس': 'lexus',
    'suzuki': 'suzuki', 'سوزوكي': 'suzuki',
    'mg': 'mg', 'ام جي': 'mg', 'إم جي': 'mg',
    'chery': 'chery', 'شيري': 'chery',
    'geely': 'geely', 'جيلي': 'geely',
    'byd': 'byd', 'بي واي دي': 'byd',
  };
  return aliases[lower] || lower;
}

function estimateBasePrice(brand: string, year: number, model: string): number {
  const normalized = normalizeBrand(brand);
  const brandPrices = JORDAN_BASE_PRICES[normalized];
  if (!brandPrices) return 12000;

  const currentYear = new Date().getFullYear();
  let base = 0;

  const years = Object.keys(brandPrices).map(Number).sort((a, b) => b - a);
  if (year >= years[0]) base = brandPrices[years[0]] * 1.05;
  else if (year <= years[years.length - 1]) base = brandPrices[years[years.length - 1]] * 0.7;
  else {
    for (let i = 0; i < years.length - 1; i++) {
      if (year <= years[i] && year >= years[i + 1]) {
        const ratio = (years[i] - year) / (years[i] - years[i + 1]);
        base = brandPrices[years[i]] + ratio * (brandPrices[years[i + 1]] - brandPrices[years[i]]);
        break;
      }
    }
  }
  if (base === 0) base = brandPrices[years[0]] || 12000;

  const modelLower = (model || '').toLowerCase();
  const luxuryModels = ['camry', 'accord', 'corolla', 'sentra', 'elantra', 'sonata', 'optima', '3 series', 'c class', 'a4', 'es', 'is', 'rx'];
  const suvModels = ['rav4', 'crv', 'tucson', 'sportage', 'xtrail', 'pathfinder', 'highlander', 'pilot', 'sorento', '7 series', 'x5', 'gle', 'q7', 'lx', 'gx', 'x7'];
  const pickupModels = ['hilux', 'ranger', 'tucson', 'frontier', 'navara', 'colorado', 'tacoma'];

  if (suvModels.some(m => modelLower.includes(m))) base *= 1.25;
  else if (pickupModels.some(m => modelLower.includes(m))) base *= 1.35;
  else if (luxuryModels.some(m => modelLower.includes(m))) base *= 1.1;

  return Math.round(base);
}

async function scrapeOpenSooq(brand: string, model: string, year: number): Promise<MarketPrice[]> {
  const results: MarketPrice[] = [];
  try {
    const searchQuery = `${brand} ${model} ${year}`.trim();
    const url = `https://jo.opensooq.com/en/cars-cars-for-sale?search=${encodeURIComponent(searchQuery)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return results;
    const html = await response.text();

    const pricePattern = /(?:JD|د\.?أ|دج|دينار)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:JD|د\.?أ|دج|دينار)/gi;
    const kmPattern = /([\d,]+)\s*(?:km|كم|k\.m)/gi;
    const yearPattern = /\b(20[12]\d)\b/g;

    let match;
    const prices: number[] = [];
    while ((match = pricePattern.exec(html)) !== null) {
      const priceStr = (match[1] || match[2] || '').replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (price > 500 && price < 200000) prices.push(price);
    }

    const kmMatches: number[] = [];
    while ((match = kmPattern.exec(html)) !== null) {
      const km = parseInt(match[1].replace(/,/g, ''));
      if (km > 0 && km < 500000) kmMatches.push(km);
    }

    const yearMatches: number[] = [];
    while ((match = yearPattern.exec(html)) !== null) {
      const y = parseInt(match[1]);
      if (y >= 2015 && y <= 2026) yearMatches.push(y);
    }

    for (let i = 0; i < Math.min(prices.length, 10); i++) {
      results.push({
        source: 'OpenSooq',
        title: `${brand} ${model} ${yearMatches[i] || year}`,
        price: prices[i],
        year: yearMatches[i] || year,
        km: kmMatches[i] || 0,
        url,
        location: 'الأردن',
      });
    }
  } catch {
    // OpenSooq scraping failed, return empty
  }
  return results;
}

async function scrapeYallaMotor(brand: string, model: string, year: number): Promise<MarketPrice[]> {
  const results: MarketPrice[] = [];
  try {
    const searchQuery = `${brand} ${model} ${year}`.trim();
    const url = `https://www.yallamotor.com/used-cars/jordan?q=${encodeURIComponent(searchQuery)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return results;
    const html = await response.text();

    const pricePattern = /(?:JD|د\.?أ|دج|دينار)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:JD|د\.?أ|دج|دينار)/gi;
    const kmPattern = /([\d,]+)\s*(?:km|كم|k\.m)/gi;

    let match;
    const prices: number[] = [];
    while ((match = pricePattern.exec(html)) !== null) {
      const priceStr = (match[1] || match[2] || '').replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (price > 500 && price < 200000) prices.push(price);
    }

    const kmMatches: number[] = [];
    while ((match = kmPattern.exec(html)) !== null) {
      const km = parseInt(match[1].replace(/,/g, ''));
      if (km > 0 && km < 500000) kmMatches.push(km);
    }

    for (let i = 0; i < Math.min(prices.length, 10); i++) {
      results.push({
        source: 'YallaMotor',
        title: `${brand} ${model} ${year}`,
        price: prices[i],
        year,
        km: kmMatches[i] || 0,
        url,
        location: 'الأردن',
      });
    }
  } catch {
    // YallaMotor scraping failed
  }
  return results;
}

async function scrapeMahamot(brand: string, model: string, year: number): Promise<MarketPrice[]> {
  const results: MarketPrice[] = [];
  try {
    const searchQuery = `${brand} ${model} ${year}`.trim();
    const url = `https://www.mahamot.com/cars?search=${encodeURIComponent(searchQuery)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return results;
    const html = await response.text();

    const pricePattern = /(?:JD|د\.?أ|دج|دينار)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:JD|د\.?أ|دج|دينار)/gi;
    const kmPattern = /([\d,]+)\s*(?:km|كم|k\.m)/gi;

    let match;
    const prices: number[] = [];
    while ((match = pricePattern.exec(html)) !== null) {
      const priceStr = (match[1] || match[2] || '').replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (price > 500 && price < 200000) prices.push(price);
    }

    const kmMatches: number[] = [];
    while ((match = kmPattern.exec(html)) !== null) {
      const km = parseInt(match[1].replace(/,/g, ''));
      if (km > 0 && km < 500000) kmMatches.push(km);
    }

    for (let i = 0; i < Math.min(prices.length, 10); i++) {
      results.push({
        source: 'Mahamot',
        title: `${brand} ${model} ${year}`,
        price: prices[i],
        year,
        km: kmMatches[i] || 0,
        url,
        location: 'الأردن',
      });
    }
  } catch {
    // Mahamot scraping failed
  }
  return results;
}

function calculateStats(prices: number[]): MarketStats {
  if (prices.length === 0) return { min: 0, max: 0, avg: 0, median: 0, count: 0, sources: [] };
  const sorted = [...prices].sort((a, b) => a - b);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return { min: sorted[0], max: sorted[sorted.length - 1], avg, median, count: prices.length, sources: [] };
}

function adjustForKm(price: number, km: number, year: number): number {
  const age = new Date().getFullYear() - year;
  const expectedKm = age * 20000;
  if (expectedKm === 0) return price;
  const ratio = km / expectedKm;
  if (ratio > 1.5) return Math.round(price * 0.85);
  if (ratio > 1.2) return Math.round(price * 0.92);
  if (ratio < 0.5) return Math.round(price * 1.10);
  if (ratio < 0.8) return Math.round(price * 1.05);
  return price;
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
  const [webResults, dbResults] = await Promise.all([
    getWebPrices(brand, model, year),
    getDbPrices(brand, model, year),
  ]);

  const allWebPrices = webResults.map(p => p.price);
  const allDbPrices = dbResults.prices;

  const combinedPrices = [...allWebPrices, ...allDbPrices];
  const combinedStats = calculateStats(combinedPrices);

  const sources = [...new Set(webResults.map(p => p.source))];
  if (allDbPrices.length > 0) sources.push('JO Cars');

  combinedStats.sources = sources;

  const conditionMult = CONDITION_MULTIPLIERS[condition] || 0.95;
  const baseEstimate = combinedStats.avg || estimateBasePrice(brand, year, model);
  const kmAdjusted = adjustForKm(baseEstimate, km, year);
  const estimatedPrice = Math.round(kmAdjusted * conditionMult);

  const diff = allDbPrices.length > 0
    ? ((estimatedPrice - combinedStats.avg) / combinedStats.avg) * 100
    : 0;

  let priceLabel: { label: string; color: string; icon: string };
  if (diff < -10) priceLabel = { label: 'أقل من السوق', color: 'text-green-500', icon: 'trending-down' };
  else if (diff < 5) priceLabel = { label: 'سعر السوق', color: 'text-blue-500', icon: 'check-circle' };
  else if (diff < 15) priceLabel = { label: 'أعلى من السوق', color: 'text-amber-500', icon: 'trending-up' };
  else priceLabel = { label: 'غالي مقارنة بالسوق', color: 'text-red-500', icon: 'alert-triangle' };

  return {
    stats: combinedStats,
    webPrices: webResults.slice(0, 8),
    dbPrices: {
      min: dbResults.min,
      max: dbResults.max,
      avg: dbResults.avg,
      median: dbResults.median,
      count: dbResults.count,
    },
    estimatedPrice,
    priceLabel,
  };
}

async function getWebPrices(brand: string, model: string, year: number): Promise<MarketPrice[]> {
  const results = await Promise.all([
    scrapeOpenSooq(brand, model, year),
    scrapeYallaMotor(brand, model, year),
    scrapeMahamot(brand, model, year),
  ]);
  return results.flat();
}

async function getDbPrices(brand: string, model: string, year: number): Promise<{
  prices: number[];
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
}> {
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

    const prices = cars.map(c => c.price).filter(p => p > 0);
    if (prices.length === 0) return { prices: [], min: 0, max: 0, avg: 0, median: 0, count: 0 };

    const stats = calculateStats(prices);
    return { prices, min: stats.min, max: stats.max, avg: stats.avg, median: stats.median, count: stats.count };
  } catch {
    return { prices: [], min: 0, max: 0, avg: 0, median: 0, count: 0 };
  }
}
