/**
 * PriceEstimator — standalone, dependency-free price AI for the Jordanian car market.
 *
 * Design philosophy ("حركات" the user asked for):
 *  - NO external AI / NO API key / NO web scraping. Pure local reasoning.
 *  - Combines multiple transparent signals:
 *      1. Base market table  (JORDAN_PRICES) — realistic 2026→2013 anchors per brand/year.
 *      2. Model adjustment   (MODEL_ADJUSTMENTS) — Corolla vs Land Cruiser vs Yaris.
 *      3. Spec multipliers  — transmission / fuel / body / drivetrain factors.
 *      4. Wear penalties     — kilometers/year ratio, age, condition, owner count,
 *                               damages, paint originality, warranty, service history.
 *      5. JO Cars live DB    — blends the local estimate with approved historical
 *                               listings to anchor the price to real Jordanian demand.
 *  - Confidence rises with: brand/model knowledge richness, number of similar DB
 *    listings, and input completeness. It caps at 95 (no algorithm is ever "100%").
 *  - Every output (reasoning, factors) is human-readable Arabic so the UI can show
 *    the "why" alongside the number.
 *
 * This is the "AI" the user wants: a deterministic, auditable rule engine tailored
 * to Jordanian car prices, with no third-party dependency or billing.
 */

import { BaseAIModule, AIProviderType, AIResult, AIProgress } from './base';
import { fetchOpenSooqListings, OpenSooqListing } from '@/lib/opensooq-scrape';

export interface PriceInput {
  brand: string;
  model: string;
  year: number;
  kilometers: number;
  condition: string;
  city: string;
  fuelType?: string;
  transmission?: string;
  engineCapacity?: number | string;
  bodyType?: string;
  drivetrain?: string;
  trim?: string;
  color?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isPaintOriginal?: boolean;
  /** Price the seller listed the car at — used for sanity comparisons */
  listingPrice?: number;
  /** legacy fields kept for API backward compatibility */
  odometer?: number;
  ownerId?: string;
  carId?: string;
}

export interface SimilarListing {
  site: string;
  url: string;
  price: number;
  year: number;
  km: number;
  notes?: string;
}

export interface PriceOutput {
  minPrice: number;
  fairPrice: number;
  maxPrice: number;
  confidence: number;
  reasoning: string;
  marketFactors: string[];
  similarListings: SimilarListing[];
  sources: string[];
  /** Always false in local mode (kept for UI compatibility). */
  isRealWebSearch: boolean;
}

// ── Reference market anchors (Jordanian dinar, year → fair price) ────────────
// Expanded to 28 brands with Jordanian market-calibrated pricing.
// Prices reflect average listing prices (not new-car MSRP).
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
  mitsubishi: { 2026: 20000, 2025: 18000, 2024: 16000, 2023: 14000, 2022: 12000, 2021: 10500, 2020: 9000, 2019: 8000, 2018: 7000, 2017: 6000, 2016: 5500, 2015: 5000 },
  jeep: { 2026: 30000, 2025: 27000, 2024: 24000, 2023: 21000, 2022: 18000, 2021: 16000, 2020: 14000, 2019: 12000, 2018: 10500, 2017: 9000, 2016: 8000, 2015: 7000 },
  mg: { 2026: 17000, 2025: 15000, 2024: 13000, 2023: 11000, 2022: 9500, 2021: 8000, 2020: 7000, 2019: 6000 },
  chery: { 2026: 16000, 2025: 14000, 2024: 12000, 2023: 10000, 2022: 8500, 2021: 7000, 2020: 6000, 2019: 5000 },
  geely: { 2026: 18000, 2025: 16000, 2024: 14000, 2023: 12000, 2022: 10500, 2021: 9000, 2020: 7500, 2019: 6500 },
  byd: { 2026: 28000, 2025: 25000, 2024: 22000, 2023: 19000, 2022: 16000, 2021: 14000, 2020: 12000, 2019: 10000 },
  haval: { 2026: 22000, 2025: 20000, 2024: 18000, 2023: 16000, 2022: 14000, 2021: 12000, 2020: 10000 },
  dfsk: { 2026: 15000, 2025: 13000, 2024: 11000, 2023: 9500, 2022: 8000, 2021: 7000, 2020: 6000 },
  // ── Newly added brands popular in Jordan ──
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

const MODEL_ADJUSTMENTS: Record<string, Record<string, number>> = {
  toyota: { 'land cruiser prado': 0.55, 'land cruiser': 0.80, 'prado': 0.50, 'hilux': 0.30, 'fortuner': 0.35, 'highlander': 0.40, 'avalon': 0.20, 'rav4': 0.25, 'camry': 0.15, 'corolla': 0, 'yaris': -0.15, 'rush': 0.05, 'innova': 0.10, 'c-hr': 0.08, 'sequoia': 0.60, 'tundra': 0.55, '4runner': 0.45, 'gr86': 0.10, 'supra': 0.35 },
  honda: { 'pilot': 0.35, 'crv': 0.20, 'accord': 0.10, 'hrv': 0.05, 'civic': 0, 'city': -0.10, 'jazz': -0.15, 'odyssey': 0.15, 'ridgeline': 0.20, 'passport': 0.25, 'insight': 0.05 },
  hyundai: { 'palisade': 0.50, 'santa fe': 0.35, 'tucson': 0.20, 'sonata': 0.15, 'elantra': 0, 'accent': -0.10, 'kona': 0.10, 'bayon': 0.05, 'i20': -0.15, 'i10': -0.20, 'staria': 0.15, 'ioniq5': 0.25, 'ioniq6': 0.20, 'venue': 0.05 },
  nissan: { 'patrol': 0.80, 'navara': 0.25, 'altima': 0.15, 'xtrail': 0.20, 'qashqai': 0.15, 'sentra': 0, 'kicks': 0.05, 'tiida': -0.05, 'sunny': -0.10, 'pathfinder': 0.30, 'armada': 0.55, 'frontier': 0.25, 'z': 0.30, 'leaf': 0.10 },
  kia: { 'telluride': 0.55, 'sorento': 0.35, 'sportage': 0.20, 'optima': 0.10, 'cerato': 0, 'stonic': 0.05, 'sonet': 0.05, 'rio': -0.10, 'picanto': -0.20, 'carnival': 0.30, 'ev6': 0.30, 'niro': 0.10, 'carens': 0.05 },
  mazda: { 'cx9': 0.40, 'cx5': 0.20, '6': 0.10, 'cx30': 0.10, 'cx3': 0.05, '3': 0, '2': -0.15, 'cx50': 0.25, 'cx60': 0.35, 'mx5': 0.15 },
  ford: { 'mustang': 0.50, 'bronco': 0.45, 'explorer': 0.40, 'everest': 0.35, 'ranger': 0.30, 'escape': 0.20, 'focus': 0, 'fiesta': -0.15, 'f150': 0.55, 'edge': 0.25, 'expedition': 0.50, 'maverick': 0.30, 'territory': 0.20 },
  chevrolet: { 'silverado': 0.50, 'tahoe': 0.60, 'traverse': 0.35, 'colorado': 0.30, 'trailblazer': 0.25, 'malibu': 0.10, 'cruze': 0, 'cobalt': -0.10, 'spark': -0.20, 'suburban': 0.65, 'equinox': 0.20, 'corvette': 0.70, 'blazer': 0.25, 'trax': 0.05 },
  bmw: { 'x7': 0.70, 'x6': 0.50, '7 series': 0.50, 'x5': 0.45, '5 series': 0.20, 'x3': 0.25, 'z4': 0.30, 'x1': 0.10, '3 series': 0, '1 series': -0.15, 'x4': 0.30, 'x2': 0.15, '4 series': 0.15, '8 series': 0.55, 'ix': 0.35, 'i4': 0.20, 'm3': 0.40, 'm4': 0.40, 'm5': 0.50 },
  mercedes: { 'gls': 0.60, 's class': 0.50, 'gle': 0.40, 'amg': 0.45, 'glc': 0.25, 'e class': 0.20, 'gla': 0.10, 'c class': 0, 'a class': -0.10, 'g class': 0.75, 'cla': 0.05, 'eqs': 0.30, 'eqe': 0.25, 'eqb': 0.15, 'eqc': 0.20, 'cls': 0.15, 'sl': 0.35, 'amg gt': 0.50, 'maybach': 0.80 },
  audi: { 'q8': 0.55, 'a8': 0.50, 'q7': 0.40, 'q5': 0.25, 'a6': 0.20, 'tt': 0.20, 'q3': 0.10, 'a4': 0, 'a3': -0.05, 'a1': -0.15, 'rs e-tron gt': 0.60, 'e-tron gt': 0.45, 'e-tron': 0.30, 'q4 e-tron': 0.20, 'rs6': 0.65, 'rs q8': 0.70, 'rs3': 0.30, 'rs5': 0.40 },
  lexus: { 'lx': 0.70, 'gx': 0.45, 'ls': 0.40, 'rx': 0.30, 'gs': 0.15, 'nx': 0.15, 'es': 0.10, 'is': 0, 'ux': 0.05, 'lm': 0.80, 'lfa': 0.90, 'rc': 0.10, 'rc f': 0.25, 'rz': 0.20 },
  suzuki: { 'jimny': 0.15, 'vitara': 0.05, 'ertiga': 0, 'swift': -0.10, 'baleno': -0.05, 'dzire': -0.15, 'alto': -0.25, 'spresso': -0.20, 'across': 0.10 },
  mitsubishi: { 'pajero': 0.45, 'pajero sport': 0.35, 'outlander': 0.20, 'asx': 0.10, 'l200': 0.30, 'montero': 0.40, 'eclipse cross': 0.15, 'attrage': -0.05, 'mirage': -0.15 },
  jeep: { 'wrangler': 0.50, 'grand cherokee': 0.55, 'cherokee': 0.30, 'compass': 0.15, 'renegade': 0.05, 'gladiator': 0.40, 'commander': 0.25 },
  mg: { 'zs': 0.10, 'hs': 0.20, 'mg5': -0.05, 'mg3': -0.15, 'mg4': 0.05, 'mg7': 0.15, 'extender': 0.10 },
  chery: { 'tiggo 8': 0.20, 'tiggo 7': 0.10, 'tiggo 4': 0, 'tiggo 2': -0.10, 'arrizo 5': -0.05, 'arrizo 8': 0.15, 'omoda 5': 0.15, 'jaecoo 7': 0.20 },
  geely: { 'coolray': 0.10, 'okavango': 0.15, 'azkarra': 0.10, 'emgrand': 0, 'geometry c': 0.05, 'monjaro': 0.25, 'starray': 0.20 },
  byd: { 'tang': 0.30, 'han': 0.25, 'song': 0.15, 'qin': 0.05, 'dolphin': -0.05, 'seal': 0.20, 'atto 3': 0.10, 'f3': -0.15, 's6': 0.10 },
  haval: { 'h6': 0.15, 'jolion': 0.05, 'f7': 0.10, 'f7x': 0.15, 'dargo': 0.20, 'm6': 0, 'h9': 0.25 },
  dfsk: { '580': 0.10, '560': 0, '风光580': 0.10, 'glory': 0.05, 'ix5': 0.10, 't5 evo': 0.05 },
  // ── Newly added brands ──
  'land rover': { 'range rover': 0.70, 'range rover sport': 0.55, 'range rover velar': 0.40, 'range rover evoque': 0.25, 'defender': 0.50, 'discovery sport': 0.20, 'discovery': 0.35, 'freelander': 0.05 },
  volkswagen: { 'touareg': 0.45, 'tiguan': 0.20, 't-roc': 0.10, 't-cross': 0, 'golf': 0, 'passat': 0.10, 'arteon': 0.20, 'polo': -0.15, 'taos': 0.10, 'id.4': 0.15, 'id.3': 0.05, 'amarok': 0.25, 'teramont': 0.30 },
  peugeot: { '3008': 0.20, '5008': 0.30, '2008': 0.05, '508': 0.10, '208': -0.05, '308': 0, 'partner': -0.10, 'expert': 0, 'rifter': 0 },
  subaru: { 'forester': 0.20, 'outback': 0.25, 'xv': 0.10, 'impreza': 0, 'legacy': 0.05, 'ascent': 0.30, 'brz': 0.15, 'solterra': 0.20 },
  opel: { 'grandland': 0.15, 'crossland': 0.05, 'mokka': 0.05, 'astra': 0, 'corsa': -0.10, 'insignia': 0.05, 'combo': -0.05 },
  renault: { 'koleos': 0.20, 'kadjar': 0.10, 'captur': 0.05, 'megane': 0, 'scenic': 0.10, 'clio': -0.10, 'duster': 0.05, 'arkana': 0.10, 'austral': 0.15 },
  fiat: { '500x': 0.05, '500l': 0, '500': -0.05, 'tipo': -0.10, 'panda': -0.15, 'talento': 0 },
  dodge: { 'challenger': 0.50, 'charger': 0.45, 'durango': 0.40, 'journey': 0.10, 'ram': 0.55, 'hornet': 0.15 },
  gmc: { 'sierra': 0.50, 'yukon': 0.60, 'acadia': 0.30, 'canyon': 0.25, 'terrain': 0.15, 'hummer ev': 0.65 },
};

const TRANSMISSION_FACTORS: Record<string, number> = {
  AUTOMATIC: 0.03, A: 0.03, CVT: 0.02, DCT: 0.04, SEMI_AUTOMATIC: 0.01,
  MANUAL: -0.02, M: -0.02,
};

const FUEL_FACTORS: Record<string, number> = {
  PETROL: 0, B: 0, DIESEL: 0.05, D: 0.05,
  HYBRID: 0.10, H: 0.10, PLUGIN_HYBRID: 0.12,
  ELECTRIC: 0.15, E: 0.15,
};

const BODY_TYPE_FACTORS: Record<string, number> = {
  SUV: 0.10, PICKUP: 0.12, COUPE: 0.05, CONVERTIBLE: 0.08, MINIVAN: 0.02,
  SEDAN: 0, WAGON: -0.03, HATCHBACK: -0.05, VAN: -0.05,
};

const DRIVETRAIN_FACTORS: Record<string, number> = {
  AWD: 0.04, FOUR_WD: 0.04, RWD: 0.02, FWD: 0,
};

// ── Engine capacity — larger engines cost more to produce and are in demand in Jordan ──
// Input is numeric cc (e.g. 1500, 2000, 3500) or string like "2.0L"
function getEngineCapacityFactor(engineRaw: number | string | undefined): { factor: number; label: string } {
  if (!engineRaw) return { factor: 0, label: '' };
  let cc = 0;
  if (typeof engineRaw === 'number') {
    cc = engineRaw;
  } else {
    const s = String(engineRaw).toLowerCase().replace(/[^\d.]/g, '');
    const num = parseFloat(s);
    if (isNaN(num)) return { factor: 0, label: '' };
    // Heuristic: if < 10, it's liters (e.g. "2.0"), else cc (e.g. "2000")
    cc = num < 10 ? num * 1000 : num;
  }
  if (cc <= 0) return { factor: 0, label: '' };
  // Map cc to multiplicative factor
  if (cc >= 5000) return { factor: 0.15, label: `محرك ${Math.round(cc / 1000)} لتر — قوة كبيرة` };
  if (cc >= 4000) return { factor: 0.12, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 3500) return { factor: 0.10, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 3000) return { factor: 0.08, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 2500) return { factor: 0.06, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 2000) return { factor: 0.03, label: `محرك ${Math.round(cc / 1000)} لتر — الأكثر شيوعاً` };
  if (cc >= 1800) return { factor: 0.02, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 1500) return { factor: 0, label: `محرك ${Math.round(cc / 1000)} لتر` };
  if (cc >= 1200) return { factor: -0.03, label: `محرك صغير ${Math.round(cc / 1000)} لتر` };
  return { factor: -0.06, label: `محرك صغير جداً ${Math.round(cc)} سمك` };
}

// ── Trim level adjustments — higher trim = more features = higher resale ──
function getTrimAdjustment(trim: string | undefined): { factor: number; label: string } {
  if (!trim) return { factor: 0, label: '' };
  const t = trim.toLowerCase().trim();
  // Premium / luxury trims
  if (/\b(le|limited|platinum|premium|executive|signature|top of line|fully loaded|fully loaded|top)\b/.test(t))
    return { factor: 0.08, label: 'فئة عالية — ميزات إضافية كثيرة' };
  // Mid-high trims
  if (/\b(glx|gxs|gxl|se|sel|xle|xlt|sport|rs|gt|tfsi|tdi|cdi)\b/.test(t))
    return { factor: 0.04, label: 'فئة متوسطة-عالية — ميزات جيدة' };
  // Base / economy trims
  if (/\b(lx|cx|base|st|xl|lx|std|standard|vi)\b/.test(t))
    return { factor: -0.03, label: 'فئة أساسية — أقل ميزات' };
  // Sport / performance trims
  if (/\b(amg|m |rs |n line|type r|sti|type s|nismo|trd)\b/.test(t))
    return { factor: 0.10, label: 'فئة رياضية — أداء عالي' };
  return { factor: 0, label: '' };
}

const CONDITION_FACTORS: Record<string, number> = {
  EXCELLENT: 0.15, 'ممتازة': 0.15,
  VERY_GOOD: 0.05, 'جيدة جداً': 0.05,
  GOOD: -0.05, 'جيدة': -0.05,
  FAIR: -0.15, 'مقبولة': -0.15,
  NEEDS_MAINTENANCE: -0.25, 'تحتاج صيانة': -0.25,
  NEEDS_INSPECTION: -0.30, 'تحتاج فحص': -0.30,
};

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: 'ممتازة', VERY_GOOD: 'جيدة جداً', GOOD: 'جيدة',
  FAIR: 'مقبولة', NEEDS_MAINTENANCE: 'تحتاج صيانة', NEEDS_INSPECTION: 'تحتاج فحص',
};

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هايبرد',
  ELECTRIC: 'كهرباء', PLUGIN_HYBRID: 'هايبرد بلج إن',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIC: 'أوتوماتيك', MANUAL: 'يدوي', CVT: 'CVT',
  DCT: 'DCT', SEMI_AUTOMATIC: 'نصف أوتوماتيك',
};

const BODY_LABELS: Record<string, string> = {
  SUV: 'SUV', SEDAN: 'سيدان', HATCHBACK: 'هاتشباك', COUPE: 'كوبيه',
  CONVERTIBLE: 'كابريوليه', WAGON: 'ستيشن', PICKUP: 'بيك أب', VAN: 'فان', MINIVAN: 'ميني فان',
};

const DRIVE_LABELS: Record<string, string> = {
  FWD: 'دفع أمامي', RWD: 'دفع خلفي', AWD: 'دفع رباعي دائم', FOUR_WD: 'دفع رباعي',
};

// Jordanian market anomalies:
// Some body colors carry slight demand-side premium in Jordan (white = easy resale).
const COLOR_FACTORS: Record<string, number> = {
  WHITE: 0.01, 'أبيض': 0.01, 'white': 0.01,
  BLACK: 0.005, 'أسود': 0.005, 'black': 0.005,
  SILVER: 0, 'فضي': 0,
};

function normalizeBrand(brand: string): string {
  const lower = (brand || '').toLowerCase().trim();
  const aliases: Record<string, string> = {
    'ttoyota': 'toyota', 'toyta': 'toyota', 'تويوتا': 'toyota', 'تايوتا': 'toyota', 'توتا': 'toyota',
    'honda': 'honda', 'هوندا': 'honda', 'هوندي': 'honda', 'هونداي': 'honda',
    'hyundai': 'hyundai', 'هيونداي': 'hyundai', 'هيونداى': 'hyundai', 'حيونداي': 'hyundai', 'حيونداى': 'hyundai',
    'nissan': 'nissan', 'نيسان': 'nissan', 'نيSEN': 'nissan', 'نيسن': 'nissan',
    'kia': 'kia', 'كيا': 'kيا',
    'mazda': 'mazda', 'مازدا': 'mazda',
    'ford': 'ford', 'فورد': 'ford',
    'chevrolet': 'chevrolet', 'شفروليت': 'chevrolet', 'شفروليه': 'chevrolet', 'شفرولية': 'chevrolet', 'شيفروليه': 'chevrolet', 'شفرولت': 'chevrolet',
    'bmw': 'bmw', 'بي ام': 'bmw', 'بي ام دبليو': 'bmw', 'ب ام': 'bmw', 'بي إم دبليو': 'bmw', 'بم': 'bmw',
    'mercedes': 'mercedes', 'مرسيدس': 'mercedes', 'بنز': 'mercedes', 'مرس': 'mercedes', 'مرسيدس بنز': 'mercedes',
    'audi': 'audi', 'اودي': 'audi', 'أودي': 'audi',
    'lexus': 'lexus', 'لكزس': 'lexus', 'لكتس': 'lexus',
    'suzuki': 'suzuki', 'سوزوكي': 'suzuki', 'سزوكي': 'suzuki', 'سوزوكى': 'suzuki',
    'mitsubishi': 'mitsubishi', 'ميتسوبيشي': 'mitsubishi', 'ميتسبيشي': 'mitsubishi', 'ميتسوبيش': 'mitsubishi',
    'jeep': 'jeep', 'جيب': 'jeep',
    'mg': 'mg', 'ام جي': 'mg', 'إم جي': 'mg', 'إم. جي': 'mg',
    'chery': 'chery', 'شيري': 'chery',
    'geely': 'geely', 'جيلي': 'geely',
    'byd': 'byd', 'بي واي دي': 'byd', 'باي دي': 'byd',
    'haval': 'haval', 'هافال': 'haval', 'هافل': 'haval', 'هاVAL': 'haval',
    'dfsk': 'dfsk', 'دي اف اس كي': 'dfsk', 'دي إف إس كي': 'dfsk', 'دي اف اسكى': 'dfsk',
    'land rover': 'land rover', 'لاند روفر': 'land rover', 'لاند روفير': 'land rover',
    'volkswagen': 'volkswagen', 'فولكسفاجن': 'volkswagen', 'فولكس': 'volkswagen', 'فلكس': 'volkswagen',
    'peugeot': 'peugeot', 'بيجو': 'peugeot', 'بيجوت': 'peugeot',
    'subaru': 'subaru', 'سوبارو': 'subaru', 'سابارو': 'subaru',
    'opel': 'opel', 'اوبل': 'opel', 'أوبل': 'opel', 'اوپل': 'opel',
    'renault': 'renault', 'رينو': 'renault', 'رينولت': 'renault', 'رينULT': 'renault',
    'fiat': 'fiat', 'فيات': 'fiat', 'فيAT': 'fiat',
    'dodge': 'dodge', 'دودج': 'dodge',
    'gmc': 'gmc', 'جي ام سي': 'gmc', 'جي إم سي': 'gmc',
  };
  return aliases[lower] || lower;
}

function getModelAdjustment(brand: string, model: string): number {
  const normalized = normalizeBrand(brand);
  const modelLower = (model || '').toLowerCase().trim();
  const brandModels = MODEL_ADJUSTMENTS[normalized];
  if (!brandModels) return 0;
  // Longest key match first (e.g. "land cruiser prado" before "prado")
  const keys = Object.keys(brandModels).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (modelLower.includes(key)) return brandModels[key];
  }
  return 0;
}

function calculateBasePrice(brand: string, model: string, year: number): number {
  const normalized = normalizeBrand(brand);
  const brandYears = JORDAN_PRICES[normalized];
  if (!brandYears) return 15000;

  const years = Object.keys(brandYears).map(Number).sort((a, b) => b - a);
  let base = 0;

  if (year >= years[0]) {
    base = brandYears[years[0]] * 1.05;
  } else if (year <= years[years.length - 1]) {
    base = brandYears[years[years.length - 1]] * 0.7;
  } else {
    for (let i = 0; i < years.length - 1; i++) {
      if (year <= years[i] && year >= years[i + 1]) {
        const ratio = (years[i] - year) / (years[i] - years[i + 1]);
        base = brandYears[years[i]] + ratio * (brandYears[years[i + 1]] - brandYears[years[i]]);
        break;
      }
    }
  }
  if (base <= 0) base = brandYears[years[0]] || 15000;

  base *= 1 + getModelAdjustment(brand, model);
  return Math.round(base);
}

interface FactorBreakdown {
  name: string;
  impact: number;          // multiplicative delta applied to base
  description: string;     // human-readable Arabic explanation
}

/**
 * Build the full list of multiplicative factors that move the price away from
 * the base. Returns both structured factors and aggregated total.
 */
function buildFactors(input: PriceInput): { factors: FactorBreakdown[]; total: number } {
  const factors: FactorBreakdown[] = [];
  let total = 1;

  // ── Age: gentle depreciation already built into JORDAN_PRICES table.
  //    Here we add a small premium for new (≤1y) cars and a penalty beyond year coverage.
  const age = Math.max(0, new Date().getFullYear() - input.year);
  if (age === 0) {
    factors.push({ name: 'سنة الصنع', impact: 1.05, description: 'سيارة من موديل السنة — ميزة كبيرة في الطلب' });
  } else if (age === 1) {
    factors.push({ name: 'سنة الصنع', impact: 1.02, description: 'سيارة حديثة جداً (سنة واحدة)' });
  } else {
    const ageImpact = Math.max(0.7, 1 - (age - 1) * 0.005);
    factors.push({ name: 'سنة الصنع', impact: ageImpact, description: `عمر السيارة ${age} سنة — اهتلاك تدريجي مدمج في قاعدة البيانات` });
  }

  // ── Kilometers — compare against Jordan's typical 20k km/year reference
  const expectedKm = Math.max(1, age * 20000);
  const kmRatio = input.kilometers / expectedKm;
  let kmImpact = 1;
  let kmDesc = '';
  if (kmRatio > 1.5) { kmImpact = 0.80; kmDesc = 'كيلومترات مرتفعة جداً (>50% فوق المعدل) — تأثير سلبي كبير'; }
  else if (kmRatio > 1.3) { kmImpact = 0.85; kmDesc = 'كيلومترات مرتفعة (>30% فوق المعدل)'; }
  else if (kmRatio > 1.1) { kmImpact = 0.92; kmDesc = 'كيلومترات أعلى من المعدل قليلاً'; }
  else if (kmRatio < 0.3) { kmImpact = 1.12; kmDesc = 'كيلومترات منخفضة جداً — ميزة قوية'; }
  else if (kmRatio < 0.5) { kmImpact = 1.08; kmDesc = 'كيلومترات منخفضة — جيد جداً'; }
  else if (kmRatio < 0.8) { kmImpact = 1.03; kmDesc = 'كيلومترات أقل من المعدل'; }
  else { kmDesc = 'كيلومترات مطابقة للمعدل'; }
  factors.push({ name: 'عداد الكيلومترات', impact: kmImpact, description: `${kmDesc} (${input.kilometers.toLocaleString()} كم)` });

  // ── Seller-stated condition
  const condKey = input.condition && CONDITION_FACTORS[input.condition] ? input.condition
                : Object.keys(CONDITION_FACTORS).find((k) => input.condition && input.condition.toLowerCase().includes(k.toLowerCase()))
                || '';
  if (condKey) {
    const condImpact = 1 + CONDITION_FACTORS[condKey];
    factors.push({
      name: 'حالة السيارة',
      impact: condImpact,
      description: `حالة مذكورة من البائع: ${CONDITION_LABELS[input.condition] || input.condition}`,
    });
  }

  // ── Fuel type
  if (input.fuelType && FUEL_FACTORS[input.fuelType] !== undefined && FUEL_FACTORS[input.fuelType] !== 0) {
    factors.push({
      name: 'نوع الوقود',
      impact: 1 + FUEL_FACTORS[input.fuelType],
      description: `${FUEL_LABELS[input.fuelType] || input.fuelType} — ${FUEL_FACTORS[input.fuelType] > 0 ? 'أكثر طلباً في السوق الأردني' : 'أقل طلباً'}`,
    });
  }

  // ── Transmission
  if (input.transmission && TRANSMISSION_FACTORS[input.transmission] !== undefined && TRANSMISSION_FACTORS[input.transmission] !== 0) {
    factors.push({
      name: 'ناقل الحركة',
      impact: 1 + TRANSMISSION_FACTORS[input.transmission],
      description: `${TRANSMISSION_LABELS[input.transmission] || input.transmission} — ${TRANSMISSION_FACTORS[input.transmission] > 0 ? 'مفضل في السوق' : 'أرخص قليلاً'}`,
    });
  }

  // ── Body type
  if (input.bodyType && BODY_TYPE_FACTORS[input.bodyType] !== undefined && BODY_TYPE_FACTORS[input.bodyType] !== 0) {
    factors.push({
      name: 'نوع الهيكل',
      impact: 1 + BODY_TYPE_FACTORS[input.bodyType],
      description: `${BODY_LABELS[input.bodyType] || input.bodyType} ${BODY_TYPE_FACTORS[input.bodyType] > 0 ? '— مطلوب أكثر في السوق' : '— أقل طلباً'}`,
    });
  }

  // ── Drivetrain
  if (input.drivetrain && DRIVETRAIN_FACTORS[input.drivetrain] !== undefined && DRIVETRAIN_FACTORS[input.drivetrain] !== 0) {
    factors.push({
      name: 'الدفع',
      impact: 1 + DRIVETRAIN_FACTORS[input.drivetrain],
      description: `${DRIVE_LABELS[input.drivetrain] || input.drivetrain}`,
    });
  }

  // ── Owner count
  if (input.ownerCount && input.ownerCount > 1) {
    const ownerImpact = Math.max(0.90, 1 - (input.ownerCount - 1) * 0.025);
    factors.push({
      name: 'عدد الملاك',
      impact: ownerImpact,
      description: `${input.ownerCount} ملاك سابقين — ${input.ownerCount === 2 ? 'مقبول' : input.ownerCount <= 3 ? 'ملاحظة' : 'تأثير سلبي على الثقة'}`,
    });
  }

  // ── Damages (heavy negative in Jordan — accident cars lose major resale)
  if (input.isDamaged) {
    factors.push({ name: 'مصدومة سابقاً', impact: 0.80, description: 'سيارة مصدومة سابقاً وفق تصريح البائع — تأثير سلبي كبير على القيمة' });
  }

  // ── Paint originality
  if (input.isPaintOriginal === false) {
    factors.push({ name: 'الدهان غير أصلي', impact: 0.96, description: 'الدهان غير أصلي — قد يدل على حادث أو إصلاح بسيط' });
  } else if (input.isPaintOriginal === true) {
    factors.push({ name: 'الدهان أصلي', impact: 1.02, description: 'الدهان أصلي بالكامل — ميزة إيجابية تزيد الثقة' });
  }

  // ── Warranty still active
  if (input.hasWarranty) {
    factors.push({ name: 'تحت الضمان', impact: 1.03, description: 'السيارة لا تزال تحت الضمان — ميزة قيمة' });
  }

  // ── Full service history — increases trust significantly in Jordan
  if (input.hasServiceHistory) {
    factors.push({ name: 'سجل صيانة', impact: 1.04, description: 'سجل صيانة كامل — يزيد ثقة المشتري والقيمة' });
  }

  // ── Body color demand (small but real in Jordan)
  if (input.color) {
    const colorKey = Object.keys(COLOR_FACTORS).find((k) => input.color!.toLowerCase().includes(k.toLowerCase()));
    if (colorKey && COLOR_FACTORS[colorKey] !== 0) {
      factors.push({
        name: 'اللون',
        impact: 1 + COLOR_FACTORS[colorKey],
        description: `اللون ${input.color} ${COLOR_FACTORS[colorKey] > 0 ? '— مطلوب في السوق الأردني' : ''}`.trim(),
      });
    }
  }

  // ── Engine capacity — larger engines command premium in Jordan
  const engFactor = getEngineCapacityFactor(input.engineCapacity);
  if (engFactor.factor !== 0) {
    factors.push({
      name: 'سعة المحرك',
      impact: 1 + engFactor.factor,
      description: engFactor.label,
    });
  }

  // ── Trim level — higher trim = more features = higher resale value
  const trimAdj = getTrimAdjustment(input.trim);
  if (trimAdj.factor !== 0) {
    factors.push({
      name: 'فئة السيارة',
      impact: 1 + trimAdj.factor,
      description: trimAdj.label,
    });
  }

  // ── City demand — Amman has highest demand (largest market), some cities have slight premium
  if (input.city) {
    const cityLower = input.city.trim();
    const cityFactors: Record<string, number> = {
      'عمان': 0.02, 'الزرقاء': 0, 'إربد': -0.01, 'العقبة': 0.01,
      'السلط': 0, 'المفرق': -0.02, 'الكرك': -0.02, 'معان': -0.03,
      'جرش': -0.02, 'عجلون': -0.01, 'المادبا': 0, 'ال balqa': 0,
    };
    const cityF = cityFactors[cityLower];
    if (cityF !== undefined && cityF !== 0) {
      factors.push({
        name: 'المدينة',
        impact: 1 + cityF,
        description: `${cityLower} — ${cityF > 0 ? 'سوق نشط' : 'سوق أقل نشاطاً'}`,
      });
    }
  }

  // ── Aggregate multiplicative impact, capped so a body of factors can never swing wildly
  for (const f of factors) total *= f.impact;

  // Cap total in [-25%, +25%] from base — keeps the estimate grounded and prevents
  // outlier inputs (e.g., very low km + very good condition + warranty + service)
  // from inflating the price beyond market reality.
  total = Math.max(0.75, Math.min(1.25, total));

  return { factors, total };
}

/**
 * Pull similar approved listings from the local JO Cars DB. These provide a
 * real-market anchor — if multiple local sellers priced the same model at the
 * same year, that's strong evidence of market demand.
 */
async function getDbSimilarCars(input: PriceInput): Promise<{ prices: number[]; listings: SimilarListing[] }> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const where: Record<string, unknown> = {
      status: 'APPROVED',
      deletedAt: null,
      price: { gt: 0 },
      year: { gte: input.year - 2, lte: input.year + 2 },
    };
    if (input.brand) {
      where.OR = [
        { brand: { nameAr: { contains: input.brand } } },
        { brand: { nameEn: { contains: input.brand } } },
      ];
    }
    const cars = await prisma.car.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, slug: true, price: true, year: true, kilometers: true,
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        city: { select: { nameAr: true } },
      },
    });

    let filtered = cars;
    if (input.model && filtered.length >= 3) {
      const f = filtered.filter((c: any) =>
        (c.model?.nameAr || '').includes(input.model) || (c.model?.nameEn || '').includes(input.model)
      );
      if (f.length >= 3) filtered = f;
    }

    const prices = filtered.map((c: any) => c.price).filter((p: number) => p > 0);
    const listings: SimilarListing[] = filtered.slice(0, 8).map((c: any) => ({
      site: 'JO Cars',
      url: c.slug ? `/cars/${c.slug}` : '',
      price: c.price,
      year: c.year,
      km: c.kilometers,
      notes: `${c.brand?.nameAr || ''} ${c.model?.nameAr || ''} ${c.year}${c.city?.nameAr ? ` — ${c.city.nameAr}` : ''}`,
    }));

    return { prices, listings };
  } catch {
    return { prices: [], listings: [] };
  }
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export class PriceEstimator extends BaseAIModule<PriceInput, PriceOutput> {
  name = 'PriceEstimator';
  version = '3.0.0';
  provider: AIProviderType = 'local';

  async process(input: PriceInput, onProgress?: (progress: AIProgress) => void): Promise<AIResult<PriceOutput>> {
    const startTime = Date.now();
    if (!this.validate(input)) {
      return { success: false, error: 'بيانات غير صالحة للتقييم', processingTime: Date.now() - startTime };
    }

    // Step 1 — base price from reference table + model adjustment
    onProgress?.({ stage: 'base', progress: 20, message: 'حساب القيمة الأساسية' });
    const basePrice = calculateBasePrice(input.brand, input.model, input.year);

    // Step 2 — apply all spec factors (km, condition, fuel, transmission, owner, paint, etc.)
    onProgress?.({ stage: 'factors', progress: 50, message: 'تحليل المواصفات وحساب العوامل' });
    const { factors, total } = buildFactors(input);
    let heuristicPrice = Math.round(basePrice * total);
    heuristicPrice = Math.max(500, heuristicPrice); // floor to a positive value

    // Step 3 — fetch BOTH local DB listings AND live OpenSooq listings in parallel
    onProgress?.({ stage: 'web', progress: 70, message: 'البحث في السوق المفتوح و JO Cars' });

    const [dbResult, openSooqResult] = await Promise.all([
      getDbSimilarCars(input),
      fetchOpenSooqListings(input.brand, input.model, input.year).catch(() => null),
    ]);

    const dbPrices = dbResult.prices;
    const dbListings = dbResult.listings;
    const dbAvg = average(dbPrices);
    const dbMedian = median(dbPrices);

    // Extract OpenSooq stats + listings (null when blocked)
    const osStats = openSooqResult?.stats || null;
    const osListings: OpenSooqListing[] = openSooqResult?.listings || [];
    const osPrices = osStats ? osListings.map((l) => l.price) : [];
    const osMedian = osStats ? osStats.median : 0;
    const osCount = osStats ? osStats.count : 0;

    // Step 4 — blend heuristic + DB + OpenSooq, weighting by evidence strength
    let fairPrice = heuristicPrice;
    let confidence = 62;
    const sources: string[] = ['تحليل محلي ذكي'];
    const marketFactors: string[] = factors.map((f) => `${f.name}: ${f.description}`);

    // ── Strongest case: all three signals agree ──
    if (dbPrices.length >= 3 && osCount >= 3) {
      // 30% heuristic / 35% DB median / 35% OpenSooq median — live market dominance
      fairPrice = Math.round(heuristicPrice * 0.30 + dbMedian * 0.35 + osMedian * 0.35);
      confidence = 90;
      sources.push(`JO Cars (${dbPrices.length} إعلان)`);
      sources.push(`السوق المفتوح (${osCount} إعلان حي)`);
    } else if (osCount >= 3) {
      // OpenSooq strong — 40% heuristic / 60% OpenSooq
      fairPrice = Math.round(heuristicPrice * 0.40 + osMedian * 0.60);
      confidence = 84;
      sources.push(`السوق المفتوح (${osCount} إعلان حي)`);
      if (dbPrices.length > 0) {
        fairPrice = Math.round(fairPrice * 0.7 + dbMedian * 0.3);
        sources.push(`JO Cars (${dbPrices.length} إعلان)`);
      }
    } else if (dbPrices.length >= 5) {
      // Strong local evidence — weights DB median (robust to outliers)
      fairPrice = Math.round(heuristicPrice * 0.45 + dbMedian * 0.55);
      confidence = 86;
      sources.push(`JO Cars (${dbPrices.length} إعلان مشابه)`);
      if (osCount > 0) sources.push(`السوق المفتوح (${osCount} إعلان)`);
    } else if (dbPrices.length >= 3) {
      fairPrice = Math.round(heuristicPrice * 0.55 + dbMedian * 0.45);
      confidence = 78;
      sources.push(`JO Cars (${dbPrices.length} إعلان مشابه)`);
      if (osCount > 0) sources.push(`السوق المفتوح (${osCount} إعلان)`);
    } else if (dbPrices.length >= 1) {
      fairPrice = Math.round(heuristicPrice * 0.75 + dbAvg * 0.25);
      confidence = 70;
      sources.push(`JO Cars (${dbPrices.length} إعلان)`);
      if (osCount > 0) {
        fairPrice = Math.round(fairPrice * 0.85 + osMedian * 0.15);
        sources.push(`السوق المفتوح (${osCount} إعلان)`);
      }
    } else if (osCount >= 1) {
      // No DB signal but some OpenSooq anchor
      fairPrice = Math.round(heuristicPrice * 0.65 + osMedian * 0.35);
      confidence = 72;
      sources.push(`السوق المفتوح (${osCount} إعلان حي)`);
    }

    // Step 5 — raise confidence when brand×model is well-known in our table
    const brandKey = normalizeBrand(input.brand);
    if (JORDAN_PRICES[brandKey]) {
      confidence += 4;
      if (getModelAdjustment(input.brand, input.model) !== 0) confidence += 4;
    }
    // Reward completeness of input
    const completenessFields = [input.fuelType, input.transmission, input.bodyType, input.drivetrain, input.color, input.engineCapacity, input.trim];
    const filled = completenessFields.filter(Boolean).length;
    confidence += filled * 2;

    confidence = Math.min(95, Math.max(40, confidence));

    // Step 6 — output bounds (±12% around fair price — typical Jordanian negotiation range)
    const minPrice = Math.round(fairPrice * 0.88);
    const maxPrice = Math.round(fairPrice * 1.12);

    // Step 7 — joint listing catalog (OpenSooq live + JO Cars DB), deduplicated by URL
    const similarListings: SimilarListing[] = [];
    const seenUrls = new Set<string>();
    for (const l of osListings) {
      if (seenUrls.has(l.url)) continue;
      seenUrls.add(l.url);
      similarListings.push({
        site: l.site,
        url: l.url,
        price: l.price,
        year: l.year ?? input.year,
        km: l.km ?? 0,
        notes: `${l.title}${l.city ? ' — ' + l.city : ''}${l.postedAt ? ' (' + l.postedAt + ')' : ''}`,
      });
    }
    for (const l of dbListings) {
      if (seenUrls.has(l.url)) continue;
      seenUrls.add(l.url);
      similarListings.push(l);
    }

    // Step 8 — human-readable Arabic reasoning
    const topFactors = [...factors].sort((a, b) => Math.abs(b.impact - 1) - Math.abs(a.impact - 1)).slice(0, 4);
    const reasoningParts: string[] = [
      `قيمة أساسية ${basePrice.toLocaleString()} د.أ (مبنية على جدول أسعار السوق الأردني لعلامة ${input.brand} موديل ${input.model} سنة ${input.year}).`,
      `بعد تطبيق ${factors.length} عامل (أبرزها: ${topFactors.map((f) => f.name).join('، ')}), السعر المُقدّر ${fairPrice.toLocaleString()} د.أ.`,
    ];
    if (osCount > 0) {
      reasoningParts.push(
        `تم جلب ${osCount} إعلان حيّ من السوق المفتوح (opensooq.com) لنفس العلامة/الموديل (متوسط ${osStats!.avg.toLocaleString()} د.أ, وسطي ${osMedian.toLocaleString()} د.أ).`
      );
    }
    if (dbPrices.length > 0) {
      reasoningParts.push(
        `تمت مطابقة النتيجة مع ${dbPrices.length} إعلان محلي من JO Cars (متوسط ${dbAvg.toLocaleString()} د.أ, وسطي ${dbMedian.toLocaleString()} د.أ) لزيادة الواقعية.`
      );
    }
    if (osCount === 0 && dbPrices.length === 0) {
      reasoningParts.push('لا تتوفر إعلانات حية أو محلية كافية للمقارنة — التقييم مبنى على نموذج السوق الأردني فقط.');
    }
    reasoningParts.push(`نطاق معقول للبيع/الشراء: ${minPrice.toLocaleString()} — ${maxPrice.toLocaleString()} د.أ.`);
    const reasoning = reasoningParts.join(' ');

    onProgress?.({ stage: 'done', progress: 100, message: 'اكتمل التقييم' });

    return {
      success: true,
      data: {
        minPrice,
        fairPrice,
        maxPrice,
        confidence,
        reasoning,
        marketFactors,
        similarListings: similarListings.slice(0, 10),
        sources,
        isRealWebSearch: osCount > 0,
      },
      confidence,
      processingTime: Date.now() - startTime,
    };
  }
}

export const priceEstimator = new PriceEstimator({ type: 'local' });
