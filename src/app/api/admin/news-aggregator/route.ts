import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

interface NewsSource {
  name: string;
  nameAr: string;
  url: string;
  baseUrl: string;
  linkPattern: RegExp;
  articleSelector: RegExp;
  contentSelectors: RegExp[];
}

const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'Royanews',
    nameAr: 'رؤيا',
    url: 'https://royanews.tv/',
    baseUrl: 'https://royanews.tv',
    linkPattern: /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    articleSelector: /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    contentSelectors: [
      /<p[^>]*>([\s\S]*?)<\/p>/gi,
      /<div[^>]*class="[^"]*(?:article|content|body|text|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    ],
  },
  {
    name: 'AlGhad',
    nameAr: 'الغد',
    url: 'https://www.alghad.com/',
    baseUrl: 'https://www.alghad.com',
    linkPattern: /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    articleSelector: /<a[^>]*href="([^"]+)"[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
    contentSelectors: [
      /<p[^>]*>([\s\S]*?)<\/p>/gi,
      /<div[^>]*class="[^"]*(?:article-body|content-block|story-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    ],
  },
  {
    name: 'JOCarsNews',
    nameAr: 'أخبار السيارات',
    url: 'https://www.jocars.com/news',
    baseUrl: 'https://www.jocars.com',
    linkPattern: /<a[^>]*href="([^"]*\/news\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    articleSelector: /<a[^>]*href="([^"]*\/news\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    contentSelectors: [
      /<p[^>]*>([\s\S]*?)<\/p>/gi,
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
    ],
  },
];

const CAR_KEYWORDS = [
  'سيارة', 'سيارات', 'ديزل', 'بنزين', 'وقود', 'محرك', 'مركبة', 'كهرباء', 'هايبرد',
  'بطارية', 'شحن', 'كاوتش', 'اطارات', 'زيت', 'جمرك', 'تسجيل', 'ترخيص', 'لوحة',
  'سوق', 'معرض', 'وكيل', 'تويوتا', 'هوندا', 'نيسان', 'فورد', 'كيا', 'هيونداي',
  'ميتسوبيشي', 'مازدا', 'مرسيدس', 'بي ام دبليو', 'أودي', 'لكزس', 'فولكسفاجن',
  'بيجو', 'رينو', 'شيفروليه', 'جيب', 'لاند روفر', 'بورش', 'فولفو', 'سوزوكي',
  'سوبارو', 'كرايسلر', 'دودج', 'رام', 'جمس', 'كاديلاك', 'تيسلا', 'بي واي دي',
  'جيلي', 'إم جي', 'شيري', 'شانجان', 'هافال', 'جريت وول', 'شاحنة', 'حافلة',
  ' Camden', 'موتوسيكل', 'نقل', 'مواصلات', 'طرق', 'فحص', 'صيانة', 'تصليح',
  'كامري', 'كورولا', 'النترا', 'سوناتا', 'توسان', 'سبورتاج', 'سيراتو', 'أوبتيما',
  'لاند كروزر', 'برادو', 'باترول', 'المحروقات', 'البترول', 'النفط', 'محطة', 'تعرفة',
  'مبيعات', 'إيرادات', 'تقسيط', 'قسط', 'تمويل', 'تأمين', 'إكراه', 'مزاد', 'مناقصة',
];

const CAR_BRANDS = [
  'تويوتا', 'هوندا', 'نيسان', 'فورد', 'كيا', 'هيونداي', 'ميتسوبيشي', 'مازدا',
  'مرسيدس', 'بي ام دبليو', 'بي ام دبليو', 'أودي', 'لكزس', 'فولكسفاجن', 'بيجو',
  'رينو', 'شيفروليه', 'جيب', 'لاند روفر', 'بورش', 'فولفو', 'سوزوكي', 'تيسلا',
  'كاديلاك', 'دودج', 'رام', 'جمس', 'كرايسلر', 'شانجان', 'هافال', 'جيلي', 'شيري',
];

function matchesCarContent(title: string, body?: string): boolean {
  const text = title + (body ? ' ' + body.slice(0, 500) : '');
  return CAR_KEYWORDS.some(kw => text.includes(kw)) ||
    CAR_BRANDS.some(brand => text.includes(brand));
}

function classifyCategory(title: string): string {
  if (/ديزل|بنزين|وقود|محروقات|بترول|نفط|محطة|تعرفة|إرتفاع|انخفاض/.test(title)) return 'FUEL_PRICES';
  if (/جمرك|تسجيل|ترخيص|ضريبة|استيراد|تخفيض|رسوم/.test(title)) return 'CUSTOMS';
  if (/مراجعة|تجربة|اختبار|تقييم|مقارنة|اختبار_road/.test(title)) return 'REVIEWS';
  if (/مبيعات|إيرادات|سوق|تقسيط|قسط|تمويل|تأمين/.test(title)) return 'MARKET';
  if (/صيانة|إصلاح|فحص|技术|نصيحة|إرشاد/.test(title)) return 'TIPS';
  return 'NEWS';
}

function extractTitle(html: string): string {
  const match = html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  if (match) return match[1].replace(/<[^>]+>/g, '').trim();
  const aMatch = html.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
  if (aMatch) return aMatch[1].replace(/<[^>]+>/g, '').trim();
  return html.replace(/<[^>]+>/g, '').trim();
}

async function fetchSourceArticles(source: NewsSource): Promise<{ url: string; title: string }[]> {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en;q=0.9',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const articles: { url: string; title: string }[] = [];
    const seen = new Set<string>();

    const regex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const url = match[1].trim();
      const rawTitle = match[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');

      if (!url || url === '#' || url.startsWith('javascript') || url.startsWith('tel:') || url.startsWith('mailto:')) continue;
      if (rawTitle.length < 10) continue;

      const fullUrl = url.startsWith('http') ? url : `${source.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      const key = rawTitle.slice(0, 30);
      if (seen.has(key)) continue;
      seen.add(key);

      if (matchesCarContent(rawTitle)) {
        articles.push({ url: fullUrl, title: rawTitle });
      }
    }

    return articles;
  } catch {
    return [];
  }
}

async function fetchArticleContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ar,en;q=0.9',
      },
    });
    if (!res.ok) return '';
    const html = await res.text();

    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pm;
    while ((pm = pRegex.exec(html)) !== null) {
      const text = pm[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 20 && text.length < 2000) paragraphs.push(text);
    }

    if (paragraphs.length < 3) {
      const divRegex = /<div[^>]*class="[^"]*(?:article|content|body|text|story|post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      let dm;
      while ((dm = divRegex.exec(html)) !== null) {
        const innerP = dm[1].replace(/<[^>]+>/g, '').trim();
        if (innerP.length > 50) paragraphs.push(innerP);
      }
    }

    if (paragraphs.length < 3) {
      const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
      let am;
      while ((am = articleRegex.exec(html)) !== null) {
        const text = am[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 100) paragraphs.push(text);
      }
    }

    return paragraphs.slice(0, 20).join('\n\n');
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const existing = await prisma.article.findMany({ select: { title: true } });
    const existingTitles = new Set(existing.map(a => a.title.slice(0, 40)));

    const allArticles: { url: string; title: string; source: string }[] = [];

    for (const source of NEWS_SOURCES) {
      const articles = await fetchSourceArticles(source);
      allArticles.push(...articles.map(a => ({ ...a, source: source.nameAr })));
    }

    const uniqueArticles = allArticles.filter((a, i) =>
      allArticles.findIndex(b => b.title.slice(0, 30) === a.title.slice(0, 30)) === i
    );

    const created: { title: string; slug: string; source: string }[] = [];
    const skipped: string[] = [];

    for (const article of uniqueArticles.slice(0, 20)) {
      if (existingTitles.has(article.title.slice(0, 40))) {
        skipped.push(article.title);
        continue;
      }

      const body = await fetchArticleContent(article.url);
      if (!body || body.length < 100) {
        skipped.push(article.title);
        continue;
      }

      const slugBase = article.title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60);
      const slug = `${slugBase || 'article'}-${Date.now().toString(36)}`;

      const category = classifyCategory(article.title);
      const excerpt = body.slice(0, 300) + '...';
      const content = `${body}\n\n---\n*المصدر: [${article.source}](${article.url})*`;

      try {
        const newArticle = await prisma.article.create({
          data: {
            title: article.title,
            slug,
            content,
            excerpt,
            category,
            tags: JSON.stringify([]),
            published: true,
            publishedAt: new Date(),
            authorId: user.id,
          },
        });
        created.push({ title: newArticle.title, slug: newArticle.slug, source: article.source });
      } catch {
        skipped.push(article.title);
      }
    }

    const sourceStats = NEWS_SOURCES.map(s => s.nameAr).join('، ');
    return successResponse({
      message: `تم استيراد ${created.length} مقال من (${sourceStats})، تخطي ${skipped.length}`,
      created,
      skipped,
      sourcesUsed: NEWS_SOURCES.map(s => ({ name: s.nameAr, url: s.url })),
    });
  } catch (error) {
    return errorResponse('فشل جلب الأخبار: ' + (error as Error).message, 500);
  }
}

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, title: true, slug: true, category: true,
        published: true, publishedAt: true, createdAt: true,
      },
    });
    return successResponse({ articles, sources: NEWS_SOURCES.map(s => ({ name: s.nameAr, url: s.url })) });
  } catch {
    return errorResponse('فشل تحميل الأخبار', 500);
  }
}
