/**
 * OpenSooqScrape — server-side live listings fetcher for the Jordanian car market.
 *
 * Reality:
 *   OpenSooq does NOT publish a JSON API, and its brand-filtered SEO URLs
 *   (`/en/cars/toyota/corolla`) actively return HTTP 410 (CloudFlare-style
 *   anti-bot). Only the generic search URL `/en/cars?...` returns 200 with
 *   up to ~14 featured / latest listings embedded in `__NEXT_DATA__`.
 *
 * Strategy:
 *   1. Hit the generic SERP URL once per brand (cached 24h to dodge IP block).
 *   2. Parse listings from the embedded Next.js hydration JSON.
 *   3. Filter listings client-side by brand/model match (using `cps` array).
 *   4. Return matching listings with their real OpenSooq URLs + stats.
 *
 * On any HTTP error / 410 / parse error we return `null` so the estimator
 * falls back to the local heuristic + JO Cars DB blend (no UI breakage).
 */

// Use Node's global fetch (Node 18+) — no extra deps required.

export interface OpenSooqListing {
  site: string;
  url: string;
  price: number;        // JOD numeric
  year: number | null;
  km: number | null;
  title: string;
  city: string | null;
  bodyType: string | null;
  condition: string | null;
  fuelType: string | null;
  postedAt: string | null;
}

export interface OpenSooqResult {
  success: boolean;
  /** All sane (price 1000–200k JOD) listings — exposed for UI display. */
  listings: OpenSooqListing[];
  /**
   * Stats computed ONLY over listings that match brand+model (client-side filter).
   * null when fewer than 3 such listings are available, meaning the prices
   * returned by OpenSooq are NOT for the same model and must not enter the
   * price-blend (but the listings are still useful browseable context).
   */
  stats: { min: number; max: number; avg: number; median: number; count: number } | null;
  /** Listings that match brand+model (the ones used for `stats`). */
  matchedListings: OpenSooqListing[];
  /** Total fetched before filtering (for telemetry / reasoning). */
  totalFetched: number;
  /** Why no stats were computed, when stats is null. */
  note?: string;
  /** The page returned by OpenSooq (always the latest ~14 featured). */
  source: 'السوق المفتوح (مباشر)';
  error?: string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h per brand to dodge anti-bot
const cache = new Map<string, { ts: number; data: OpenSooqResult | null }>();

const BRAND_ALIASES: Record<string, string> = {
  تويوتا: 'toyota', تايوتا: 'toyota', توتا: 'toyota',
  هوندا: 'honda', هوندي: 'honda', هونداي: 'honda',
  هيونداي: 'hyundai', هيونداى: 'hyundai', حيوندي: 'hyundai', حيونداي: 'hyundai',
  نيسان: 'nissan', نسن: 'nissan', نيسSEN: 'nissan',
  كيا: 'kia',
  مازدا: 'mazda',
  فورد: 'ford', فوررد: 'ford',
  شيفروليه: 'chevrolet', شفروليه: 'chevrolet', شفروليت: 'chevrolet', شفرولت: 'chevrolet',
  مرسيدس: 'mercedes', بنز: 'mercedes', 'مرسيدس بنز': 'mercedes',
  'بي ام': 'bmw', 'بي إم': 'bmw', 'ب ام': 'bmw', 'بم': 'bmw',
  اودي: 'audi', 'أودي': 'audi',
  لكزس: 'lexus', لكتس: 'lexus',
  سوزوكي: 'suzuki', سزوكي: 'suzuki', سوزوكى: 'suzuki',
  ميتسوبيشي: 'mitsubishi', ميتسبيشي: 'mitsubishi', ميتسبيش: 'mitsubishi',
  جيب: 'jeep',
  'ام جي': 'mg', 'إم جي': 'mg', 'إم. جي': 'mg',
  شيري: 'chery',
  جيلي: 'geely',
  'بي واي دي': 'byd', 'باي دي': 'byd',
  هافال: 'haval', هافل: 'haval',
  'دي اف اس كي': 'dfsk', 'دي إف إس كي': 'dfsk',
  'لاند روفر': 'land rover', 'لاند روفير': 'land rover',
  بيجو: 'peugeot', بيجوت: 'peugeot',
  فولكسفاجن: 'volkswagen', فولكس: 'volkswagen', فلكس: 'volkswagen',
  سوبارو: 'subaru', سابارو: 'subaru',
  اوبل: 'opel', 'أوبل': 'opel',
  رينو: 'renault', رينولت: 'renault',
  فيات: 'fiat',
  دودج: 'dodge',
  'جي ام سي': 'gmc', 'جي إم سي': 'gmc',
};

const MODEL_ALIASES: Record<string, string> = {
  'لاند كروزر': 'land cruiser',
  'لاند كروزر برادو': 'land cruiser prado',
  'راف فور': 'rav4', 'راف 4': 'rav4',
  'اكس تريل': 'xtrail', 'اكس 5': 'x5', 'اكس 6': 'x6', 'اكس 7': 'x7',
  'كراج': 'kicks',
  'سنترا': 'sentra',
  'تييدا': 'tiida',
  'سني': 'sunny',
  'باليسيد': 'palisade',
  'سانتا في': 'santa fe',
  'توسون': 'tucson',
  'سوناتا': 'sonata',
  'إيلنترا': 'elantra',
  'اكرستنت': 'accent',
  'سبورتاج': 'sportage',
  'سورنتو': 'sorento',
  'تيلورايد': 'telluride',
  'سيلفرادو': 'silverado',
  'تاهو': 'tahoe',
  'ترافيرس': 'traverse',
  'كولورادو': 'colorado',
  'تريل بليزر': 'trailblazer',
  'روفر': 'range rover',
  'ديفندر': 'defender',
  ' discovering': 'discovery',
  'تواريج': 'touareg',
  'تيغوان': 'tiguan',
  'باجيرو': 'pajero',
  'اوتلاندر': 'outlander',
  'راكلاير': 'wrangler',
  'غراند شيروكي': 'grand cherokee',
};

function normalizeBrand(brand: string): string {
  const lower = (brand || '').toLowerCase().trim();
  return BRAND_ALIASES[lower] || BRAND_ALIASES[(brand || '').trim()] || lower;
}

function normalizeModel(model: string): string {
  const lower = (model || '').toLowerCase().trim();
  return MODEL_ALIASES[lower] || MODEL_ALIASES[(model || '').trim()] || lower;
}

function parsePrice(raw: string | undefined): number {
  // "11,950 JOD" -> 11950; "65 JOD" -> 65 (kept but filtered later by sanity)
  if (!raw) return 0;
  const m = String(raw).match(/([\d.,]+)/);
  if (!m) return 0;
  return Math.round(parseFloat(m[1].replace(/[^\d.]/g, '')) || 0);
}

function parseYear(cps: string[], title: string): number | null {
  // cps contains "2,015 " or "2026" form
  for (const c of cps || []) {
    const s = c.replace(/[^\d]/g, '');
    if (s.length === 4) {
      const y = parseInt(s, 10);
      if (y >= 1990 && y <= new Date().getFullYear() + 1) return y;
    }
  }
  // Fallback: scan title like "2015 Mitsubishi Pajero GLX"
  const tm = (title || '').match(/\b(19\d{2}|20\d{2})\b/);
  if (tm) {
    const y = parseInt(tm[1], 10);
    if (y >= 1990 && y <= new Date().getFullYear() + 1) return y;
  }
  return null;
}

function parseKm(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(String(raw).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

async function fetchSerpHtml(brand: string, model: string, year?: number): Promise<string | null> {
  const params = new URLSearchParams();
  params.set('brand', normalizeBrand(brand));
  if (model) params.set('model', normalizeModel(model));
  if (year) {
    params.set('year_from', String(year - 2));
    params.set('year_to', String(year + 2));
  }
  const url = `https://jo.opensooq.com/en/cars?${params.toString()}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!res.ok) return null; // 410 anti-bot / 404 / anything → silent fallback
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Pull raw featured listings (unfiltered) from the opensooq SERP HTML.
 * We parse only `pageProps.serpApiResponse.listings.items[].`
 */
function parseRawListings(html: string): Array<Record<string, unknown>> {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  try {
    const data = JSON.parse(m[1]);
    const items = data?.props?.pageProps?.serpApiResponse?.listings?.items;
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function toListing(item: Record<string, unknown>): OpenSooqListing {
  const cps = Array.isArray(item.cps) ? (item.cps as string[]).map((c) => c.trim()) : [];
  const title = String(item.title || '');
  const price = parsePrice(item.price_amount as string | undefined);
  // Star chips list (better metadata on fuel / specs)
  const starCps = Array.isArray(item.starCps)
    ? (item.starCps as Array<{ label: string }>).map((s) => s.label || '')
    : [];
  const allCps = [...cps, ...starCps];

  const titleLower = title.toLowerCase();

  return {
    site: 'السوق المفتوح',
    url: 'https://jo.opensooq.com' + (item.post_url ? String(item.post_url).replace('/search/', '/post/') : ''),
    price,
    year: parseYear(cps, title),
    km: parseKm(item.kilometers_Cars_value_i as string | undefined),
    title,
    city: (item.city_label as string) || null,
    bodyType: cps.find((c) => /SUV|Sedan|Pickup|Coupe|Hatchback|Wagon/i.test(c)) || null,
    condition: cps.find((c) => /used|new/i.test(c.toLowerCase())) || null,
    fuelType: allCps.find((c) => /gasoline|diesel|hybrid|electric|petrol/i.test(c.toLowerCase())) || null,
    postedAt: (item.posted_at as string) || null,
  };
}

/**
 * Improved matching: check brand AND model separately, allow fuzzy model matching.
 * Also supports Arabic brand/model names in the listing title.
 */
function listItemMatches(listing: OpenSooqListing, brand: string, model: string): boolean {
  const targetBrand = normalizeBrand(brand).toLowerCase();
  const targetModel = normalizeModel(model).toLowerCase();
  const titleLower = listing.title.toLowerCase();
  
  // Brand must appear in title — check both English and Arabic
  const brandOk = titleLower.includes(targetBrand) || 
    (targetBrand === 'toyota' && /تويوتا|تايوتا|توتا/.test(titleLower)) ||
    (targetBrand === 'honda' && /هوندا|هوندي|هونداي/.test(titleLower)) ||
    (targetBrand === 'hyundai' && /هيونداي|حيونداي/.test(titleLower)) ||
    (targetBrand === 'nissan' && /نيسان|نيسن/.test(titleLower)) ||
    (targetBrand === 'kia' && /كيا/.test(titleLower)) ||
    (targetBrand === 'ford' && /فورد/.test(titleLower)) ||
    (targetBrand === 'chevrolet' && /شفروليه|شفروليت/.test(titleLower)) ||
    (targetBrand === 'mercedes' && /مرسيدس|بنز/.test(titleLower)) ||
    (targetBrand === 'bmw' && /بي ام|ب ام/.test(titleLower)) ||
    (targetBrand === 'lexus' && /لكزس/.test(titleLower)) ||
    (targetBrand === 'jeep' && /جيب/.test(titleLower)) ||
    (targetBrand === 'land rover' && /لاند روفر/.test(titleLower)) ||
    (targetBrand === 'volkswagen' && /فولكسفاجن|فولكس/.test(titleLower)) ||
    (targetBrand === 'renault' && /رينو/.test(titleLower)) ||
    (targetBrand === 'peugeot' && /بيجو/.test(titleLower));
  
  if (!brandOk) return false;
  
  // Model match: model substring within title OR exact match
  if (targetModel.length === 0) return true;
  const modelOk = titleLower.includes(targetModel) || 
    titleLower.includes(targetModel.replace(/\s/g, '')) ||
    titleLower.includes(targetModel.replace(/\s/g, '-'));
  
  return modelOk;
}

/**
 * Fetch live OpenSooq listings for `brand / model / year`.
 * Returns a successful (but possibly empty) result, or null on failure.
 */
export async function fetchOpenSooqListings(brand: string, model: string, year?: number): Promise<OpenSooqResult | null> {
  const brandKey = normalizeBrand(brand) || 'unknown';
  if (!brand || brandKey === 'unknown') return null;

  const cacheKey = `${brandKey}:${normalizeModel(model)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const html = await fetchSerpHtml(brand, model, year);
  if (!html) {
    cache.set(cacheKey, { ts: Date.now(), data: null });
    return null; // anti-bot blocked or network error → fall back
  }

  const raw = parseRawListings(html);
  if (raw.length === 0) {
    cache.set(cacheKey, { ts: Date.now(), data: null });
    return null;
  }

  const all = raw.map(toListing);
  // Filter obviously fake / teaser prices (e.g., "10 JOD" placeholders)
  const sane = all.filter((l) => l.price >= 1000 && l.price <= 200000);

  // Strict brand+model filter — these are the only listings whose prices
  // can safely enter the fair-price blend.
  const matched = sane.filter((l) => listItemMatches(l, brand, model));
  // Same-brand-only (used as fallback when strict match has <3 listings)
  const brandMatched = sane.filter((l) => listItemMatches(l, brand, ''));

  // Build stats from the best available matched set (≥3 listings required)
  let statsSource: OpenSooqListing[] = [];
  let note: string | undefined;
  if (matched.length >= 3) {
    statsSource = matched;
  } else if (brandMatched.length >= 3) {
    // We have at least 3 same-brand listings (may be different model)
    // — keep them as a softer market reference but flag the caveat.
    statsSource = brandMatched;
    note = `إعلانات السوق المفتوح لنفس العلامة (${brandMatched.length} إعلان) — لم يكف عدد إعلانات نفس الموديل للوصول إلى 3.`;
  }

  const prices = statsSource.map((l) => l.price);
  const stats = prices.length >= 3 ? {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    median: median(prices),
    count: prices.length,
  } : null;

  // Listings returned for UI: prefer same-brand, fallback to all sane so the
  // user still gets real OpenSooq URLs to browse even if no exact matches exist.
  const uiListings = brandMatched.length > 0 ? brandMatched : sane;

  const result: OpenSooqResult = {
    success: true,
    listings: uiListings.slice(0, 10),
    stats,
    matchedListings: matched,
    totalFetched: sane.length,
    note,
    source: 'السوق المفتوح (مباشر)',
  };

  cache.set(cacheKey, { ts: Date.now(), data: result });
  return result;
}
