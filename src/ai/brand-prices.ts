/**
 * Shared brand price data for all AI pricing modules.
 * Single source of truth for JORDAN_PRICES, MODEL_ADJUSTMENTS, and related data.
 */

export const JORDAN_PRICES: Record<string, Record<number, number>> = {
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
  mitsubishi: { 2026: 20000, 2025: 18000, 2024: 16000, 2023: 14000, 2022: 12000, 2021: 10500, 2020: 9000, 2019: 8000, 2018: 7000, 2017: 6000, 2016: 5500, 2015: 5000 },
  jeep: { 2026: 30000, 2025: 27000, 2024: 24000, 2023: 21000, 2022: 18000, 2021: 16000, 2020: 14000, 2019: 12000, 2018: 10500, 2017: 9000, 2016: 8000, 2015: 7000 },
  mg: { 2026: 17000, 2025: 15000, 2024: 13000, 2023: 11000, 2022: 9500, 2021: 8000, 2020: 7000, 2019: 6000 },
  chery: { 2026: 16000, 2025: 14000, 2024: 12000, 2023: 10000, 2022: 8500, 2021: 7000, 2020: 6000, 2019: 5000 },
  geely: { 2026: 18000, 2025: 16000, 2024: 14000, 2023: 12000, 2022: 10500, 2021: 9000, 2020: 7500, 2019: 6500 },
  byd: { 2026: 28000, 2025: 25000, 2024: 22000, 2023: 19000, 2022: 16000, 2021: 14000, 2020: 12000, 2019: 10000 },
  haval: { 2026: 22000, 2025: 20000, 2024: 18000, 2023: 16000, 2022: 14000, 2021: 12000, 2020: 10000 },
  dfsk: { 2026: 15000, 2025: 13000, 2024: 11000, 2023: 9500, 2022: 8000, 2021: 7000, 2020: 6000 },
  'land rover': { 2026: 55000, 2025: 50000, 2024: 45000, 2023: 40000, 2022: 35000, 2021: 31000, 2020: 27000, 2019: 24000, 2018: 21000, 2017: 18000, 2016: 15500, 2015: 13000, 2014: 11000, 2013: 9500 },
  volkswagen: { 2026: 22000, 2025: 20000, 2024: 18000, 2023: 16000, 2022: 14000, 2021: 12500, 2020: 11000, 2019: 9500, 2018: 8500, 2017: 7500, 2016: 6500, 2015: 5500, 2014: 5000, 2013: 4500 },
  peugeot: { 2026: 19000, 2025: 17000, 2024: 15000, 2023: 13000, 2022: 11500, 2021: 10000, 2020: 8500, 2019: 7500, 2018: 6500, 2017: 5500, 2016: 5000, 2015: 4500 },
  subaru: { 2026: 21000, 2025: 19000, 2024: 17000, 2023: 15000, 2022: 13000, 2021: 11500, 2020: 10000, 2019: 8500, 2018: 7500, 2017: 6500, 2016: 5500, 2015: 5000 },
  opel: { 2026: 16000, 2025: 14000, 2024: 12000, 2023: 10500, 2022: 9000, 2021: 8000, 2020: 7000, 2019: 6000, 2018: 5000, 2017: 4500 },
  renault: { 2026: 17000, 2025: 15000, 2024: 13000, 2023: 11000, 2022: 9500, 2021: 8500, 2020: 7500, 2019: 6500, 2018: 5500, 2017: 5000 },
  fiat: { 2026: 15000, 2025: 13000, 2024: 11500, 2023: 10000, 2022: 8500, 2021: 7500, 2020: 6500, 2019: 5500, 2018: 5000 },
  dodge: { 2026: 28000, 2025: 25000, 2024: 22000, 2023: 19500, 2022: 17000, 2021: 15000, 2020: 13000, 2019: 11000, 2018: 9500, 2017: 8500 },
  gmc: { 2026: 35000, 2025: 32000, 2024: 29000, 2023: 26000, 2022: 23000, 2021: 20000, 2020: 18000, 2019: 16000, 2018: 14000, 2017: 12000 },
};

export const MODEL_ADJUSTMENTS: Record<string, Record<string, number>> = {
  toyota: { 'land cruiser prado': 0.55, 'land cruiser': 0.80, 'prado': 0.50, 'hilux': 0.30, 'fortuner': 0.35, 'highlander': 0.40, 'avalon': 0.20, 'rav4': 0.25, 'camry': 0.15, 'corolla': 0, 'yaris': -0.15, 'rush': 0.05, 'innova': 0.10, 'c-hr': 0.08, 'sequoia': 0.60, 'tundra': 0.55, '4runner': 0.45 },
  honda: { 'pilot': 0.35, 'crv': 0.20, 'accord': 0.10, 'hrv': 0.05, 'civic': 0, 'city': -0.10, 'jazz': -0.15, 'odyssey': 0.15, 'ridgeline': 0.20, 'passport': 0.25 },
  hyundai: { 'palisade': 0.50, 'santa fe': 0.35, 'tucson': 0.20, 'sonata': 0.15, 'elantra': 0, 'accent': -0.10, 'kona': 0.10, 'bayon': 0.05, 'i20': -0.15, 'i10': -0.20, 'staria': 0.15, 'ioniq5': 0.25 },
  nissan: { 'patrol': 0.80, 'navara': 0.25, 'altima': 0.15, 'xtrail': 0.20, 'qashqai': 0.15, 'sentra': 0, 'kicks': 0.05, 'tiida': -0.05, 'sunny': -0.10, 'pathfinder': 0.30, 'armada': 0.55 },
  kia: { 'telluride': 0.55, 'sorento': 0.35, 'sportage': 0.20, 'optima': 0.10, 'cerato': 0, 'stonic': 0.05, 'sonet': 0.05, 'rio': -0.10, 'picanto': -0.20, 'carnival': 0.30, 'ev6': 0.30 },
  mazda: { 'cx9': 0.40, 'cx5': 0.20, '6': 0.10, 'cx30': 0.10, '3': 0, '2': -0.15, 'cx50': 0.25, 'cx60': 0.35, 'mx5': 0.15 },
  ford: { 'mustang': 0.50, 'bronco': 0.45, 'explorer': 0.40, 'everest': 0.35, 'ranger': 0.30, 'escape': 0.20, 'focus': 0, 'fiesta': -0.15, 'f150': 0.55, 'edge': 0.25, 'expedition': 0.50 },
  chevrolet: { 'silverado': 0.50, 'tahoe': 0.60, 'traverse': 0.35, 'colorado': 0.30, 'trailblazer': 0.25, 'malibu': 0.10, 'cruze': 0, 'cobalt': -0.10, 'spark': -0.20, 'suburban': 0.65, 'equinox': 0.20 },
  bmw: { 'x7': 0.70, 'x6': 0.50, '7 series': 0.50, 'x5': 0.45, '5 series': 0.20, 'x3': 0.25, 'z4': 0.30, 'x1': 0.10, '3 series': 0, '1 series': -0.15, 'x4': 0.30, 'x2': 0.15 },
  mercedes: { 'gls': 0.60, 's class': 0.50, 'gle': 0.40, 'amg': 0.45, 'glc': 0.25, 'e class': 0.20, 'gla': 0.10, 'c class': 0, 'a class': -0.10, 'g class': 0.75, 'cla': 0.05 },
  audi: { 'q8': 0.55, 'a8': 0.50, 'q7': 0.40, 'q5': 0.25, 'a6': 0.20, 'tt': 0.20, 'q3': 0.10, 'a4': 0, 'a3': -0.05, 'a1': -0.15 },
  lexus: { 'lx': 0.70, 'gx': 0.45, 'ls': 0.40, 'rx': 0.30, 'gs': 0.15, 'nx': 0.15, 'es': 0.10, 'is': 0, 'ux': 0.05 },
  suzuki: { 'jimny': 0.15, 'vitara': 0.05, 'ertiga': 0, 'swift': -0.10, 'baleno': -0.05, 'alto': -0.25 },
  mitsubishi: { 'pajero': 0.45, 'pajero sport': 0.35, 'outlander': 0.20, 'asx': 0.10, 'l200': 0.30, 'montero': 0.40, 'eclipse cross': 0.15 },
  jeep: { 'wrangler': 0.50, 'grand cherokee': 0.55, 'cherokee': 0.30, 'compass': 0.15, 'renegade': 0.05, 'gladiator': 0.40 },
  mg: { 'zs': 0.10, 'hs': 0.20, 'mg5': -0.05, 'mg3': -0.15 },
  chery: { 'tiggo 8': 0.20, 'tiggo 7': 0.10, 'tiggo 4': 0, 'tiggo 2': -0.10, 'arrizo 5': -0.05, 'arrizo 8': 0.15, 'omoda 5': 0.15 },
  geely: { 'coolray': 0.10, 'okavango': 0.15, 'azkarra': 0.10, 'emgrand': 0, 'monjaro': 0.25 },
  byd: { 'tang': 0.30, 'han': 0.25, 'song': 0.15, 'qin': 0.05, 'dolphin': -0.05, 'seal': 0.20, 'atto 3': 0.10 },
  haval: { 'h6': 0.15, 'jolion': 0.05, 'f7': 0.10, 'f7x': 0.15, 'dargo': 0.20 },
  dfsk: { '580': 0.10, '560': 0, 'glory': 0.05, 't5 evo': 0.05 },
  'land rover': { 'range rover': 0.70, 'range rover sport': 0.55, 'range rover velar': 0.40, 'range rover evoque': 0.25, 'defender': 0.50, 'discovery': 0.35 },
  volkswagen: { 'touareg': 0.45, 'tiguan': 0.20, 't-roc': 0.10, 'golf': 0, 'passat': 0.10, 'arteon': 0.20, 'polo': -0.15 },
  peugeot: { '3008': 0.20, '5008': 0.30, '2008': 0.05, '508': 0.10, '208': -0.05 },
  subaru: { 'forester': 0.20, 'outback': 0.25, 'xv': 0.10, 'impreza': 0, 'legacy': 0.05 },
  opel: { 'grandland': 0.15, 'crossland': 0.05, 'mokka': 0.05, 'astra': 0, 'corsa': -0.10 },
  renault: { 'koleos': 0.20, 'kadjar': 0.10, 'captur': 0.05, 'megane': 0, 'duster': 0.05, 'arkana': 0.10 },
  fiat: { '500x': 0.05, '500l': 0, '500': -0.05, 'tipo': -0.10 },
  dodge: { 'challenger': 0.50, 'charger': 0.45, 'durango': 0.40, 'journey': 0.10, 'ram': 0.55 },
  gmc: { 'sierra': 0.50, 'yukon': 0.60, 'acadia': 0.30, 'canyon': 0.25, 'terrain': 0.15 },
};

export const CONDITION_FACTORS: Record<string, number> = {
  EXCELLENT: 0.15, 'ممتازة': 0.15,
  VERY_GOOD: 0.05, 'جيدة جداً': 0.05,
  GOOD: -0.05, 'جيدة': -0.05,
  FAIR: -0.15, 'مقبولة': -0.15,
  NEEDS_MAINTENANCE: -0.25, 'تحتاج صيانة': -0.25,
  NEEDS_INSPECTION: -0.30, 'تحتاج فحص': -0.30,
};

export const TRANSMISSION_FACTORS: Record<string, number> = {
  AUTOMATIC: 0.03, A: 0.03, CVT: 0.02, DCT: 0.04, SEMI_AUTOMATIC: 0.01,
  MANUAL: -0.02, M: -0.02,
};

export const FUEL_FACTORS: Record<string, number> = {
  PETROL: 0, B: 0, DIESEL: 0.05, D: 0.05,
  HYBRID: 0.10, H: 0.10, PLUGIN_HYBRID: 0.12,
  ELECTRIC: 0.15, E: 0.15,
};

export const BODY_TYPE_FACTORS: Record<string, number> = {
  SUV: 0.10, PICKUP: 0.12, COUPE: 0.05, CONVERTIBLE: 0.08, MINIVAN: 0.02,
  SEDAN: 0, WAGON: -0.03, HATCHBACK: -0.05, VAN: -0.05,
};

export const DRIVETRAIN_FACTORS: Record<string, number> = {
  AWD: 0.04, FOUR_WD: 0.04, RWD: 0.02, FWD: 0,
};

export const BRAND_ALIASES: Record<string, string> = {
  'toyota': 'toyota', 'تويوتا': 'toyota', 'تايوتا': 'toyota', 'توتا': 'toyota',
  'honda': 'honda', 'هوندا': 'honda', 'هوندي': 'honda',
  'hyundai': 'hyundai', 'هيونداي': 'hyundai', 'حيونداي': 'hyundai',
  'nissan': 'nissan', 'نيسان': 'nissan', 'نيسن': 'nissan',
  'kia': 'kia', 'كيا': 'kia',
  'mazda': 'mazda', 'مازدا': 'mazda',
  'ford': 'ford', 'فورد': 'ford',
  'chevrolet': 'chevrolet', 'شفروليت': 'chevrolet', 'شفروليه': 'chevrolet',
  'bmw': 'bmw', 'بي ام': 'bmw', 'بي ام دبليو': 'bmw', 'بي إم دبليو': 'bmw',
  'mercedes': 'mercedes', 'مرسيدس': 'mercedes', 'بنز': 'mercedes',
  'audi': 'audi', 'اودي': 'audi', 'أودي': 'audi',
  'lexus': 'lexus', 'لكزس': 'lexus',
  'suzuki': 'suzuki', 'سوزوكي': 'suzuki', 'سزوكي': 'suzuki',
  'mitsubishi': 'mitsubishi', 'ميتسوبيشي': 'mitsubishi',
  'jeep': 'jeep', 'جيب': 'jeep',
  'mg': 'mg', 'ام جي': 'mg', 'إم جي': 'mg',
  'chery': 'chery', 'شيري': 'chery',
  'geely': 'geely', 'جيلي': 'geely',
  'byd': 'byd', 'بي واي دي': 'byd',
  'haval': 'haval', 'هافال': 'haval',
  'dfsk': 'dfsk', 'دي اف اس كي': 'dfsk',
  'land rover': 'land rover', 'لاند روفر': 'land rover',
  'volkswagen': 'volkswagen', 'فولكسفاجن': 'volkswagen', 'فولكس': 'volكسابتن',
  'peugeot': 'peugeot', 'بيجو': 'peugeot',
  'subaru': 'subaru', 'سوبارو': 'subaru',
  'opel': 'opel', 'أوبل': 'opel',
  'renault': 'renault', 'رينو': 'renault',
  'fiat': 'fiat', 'فيات': 'fiat',
  'dodge': 'dodge', 'دودج': 'dodge',
  'gmc': 'gmc', 'جي ام سي': 'gmc',
};

export function normalizeBrand(brand: string): string {
  const lower = (brand || '').toLowerCase().trim();
  return BRAND_ALIASES[lower] || lower;
}

export function calculateBasePrice(brand: string, model: string, year: number): number {
  const normalized = normalizeBrand(brand);
  const brandPrices = JORDAN_PRICES[normalized];
  if (!brandPrices) return 15000;

  const years = Object.keys(brandPrices).map(Number).sort((a, b) => b - a);
  let base = 0;

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

  if (base === 0) base = brandPrices[years[0]] || 15000;

  const modelLower = model.toLowerCase().trim();
  const brandModels = MODEL_ADJUSTMENTS[normalized];
  if (brandModels) {
    for (const [key, adj] of Object.entries(brandModels)) {
      if (modelLower.includes(key)) { base *= (1 + adj); break; }
    }
  }

  return Math.round(base);
}

export function getModelAdjustment(brand: string, model: string): number {
  const normalized = normalizeBrand(brand);
  const modelLower = (model || '').toLowerCase().trim();
  const brandModels = MODEL_ADJUSTMENTS[normalized];
  if (!brandModels) return 0;
  const keys = Object.keys(brandModels).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (modelLower.includes(key)) return brandModels[key];
  }
  return 0;
}
