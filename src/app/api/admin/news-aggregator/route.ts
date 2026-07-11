import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

const SOURCE_URL = 'https://royanews.tv/';
const CAR_KEYWORDS = ['سيارة', 'سيارات', 'ديزل', 'بنزين', 'وقود', 'محرك', 'مركبة', 'كهرباء', 'هايبرد', 'بطارية', 'شحن', 'كاوتش', 'اطارات', 'زيت', 'زفر', 'جمرك', 'تسجيل', 'ترخيص', 'لوحة', 'سوق', 'معرض', 'وكيل', 'تويوتا', 'هوندا', 'نيسان', 'فورد', 'كيا', 'هيونداي', 'ميتسوبيشي', 'مازدا', 'مرسيدس', 'بي ام دبليو', 'أودي', 'لكزس', 'فولكس', 'فولكسفاجن', 'بيجو', 'رينو', 'شيفروليه', 'جيب', 'رنج', 'لاند روفر', 'بورش', 'فيراري', 'لامبورجيني', 'فولفو', 'سوزوكي', 'سوبارو', 'سكودا', 'سيات', 'داسيا', 'أوبل', 'كرايسلر', 'دودج', 'رام', 'جمس', 'كاديلاك', 'تيسلا', 'بي واي دي', 'جيلي', 'إم جي', 'شيري', 'شانجان', 'هافال', 'جريت وول', 'فاو', 'بريليانس', 'أسبايدر', 'أوتوزوم', 'أبو مازن', 'تريلا', 'شاحنة', 'حافلة', 'دراجة', 'موتوسيكل', 'نقل', 'مواصلات', 'طرق', 'شارع', 'جسر', 'حملة', 'فحص', 'صيانة', 'تصليح', 'بنشر', 'كامري', 'كورولا', 'النترا', 'سوناتا', 'توسان', 'سبورتاج', 'سيراتو', 'أوبتيما', 'لاند كروزر', 'برادو', 'باترول', 'الخليج', 'المحروقات', 'البترول', 'النفط', 'محطة', 'تعرفة'];
const ARABIC_SECTIONS = ['اقتصاد', 'تكنولوجيا', 'هنا وهناك'];

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const res = await fetch(SOURCE_URL, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JoCarsBot/1.0)' },
    });
    const html = await res.text();

    // Extract article links
    const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const articleBlocks: { url: string; title: string }[] = [];
    const seen = new Set<string>();
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1].trim();
      const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();

      if (!url || url === '#' || url.startsWith('javascript') || url.startsWith('tel:') || url.startsWith('mailto:')) continue;
      if (rawTitle.length < 10) continue;

      const fullUrl = url.startsWith('http') ? url : `https://royanews.tv${url.startsWith('/') ? '' : '/'}${url}`;
      const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim();

      const key = cleanTitle.slice(0, 30);
      if (seen.has(key)) continue;
      seen.add(key);

      const hasCarKeyword = CAR_KEYWORDS.some(kw => cleanTitle.includes(kw));
      if (hasCarKeyword) {
        articleBlocks.push({ url: fullUrl, title: cleanTitle });
      }
    }

    // Deduplicate by existing articles
    const existing = await prisma.article.findMany({
      select: { title: true },
    });
    const existingTitles = new Set(existing.map(a => a.title.slice(0, 40)));

    const created: { title: string; slug: string }[] = [];
    const skipped: string[] = [];

    for (const article of articleBlocks.slice(0, 10)) {
      if (existingTitles.has(article.title.slice(0, 40))) {
        skipped.push(article.title);
        continue;
      }

      try {
        const contentRes = await fetch(article.url, {
          signal: AbortSignal.timeout(10000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JoCarsBot/1.0)' },
        });
        const contentHtml = await contentRes.text();

        // Extract paragraphs
        const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        const paragraphs: string[] = [];
        let pm;
        while ((pm = pRegex.exec(contentHtml)) !== null) {
          const text = pm[1].replace(/<[^>]+>/g, '').trim();
          if (text.length > 20) paragraphs.push(text);
        }

        // Also try div content blocks
        if (paragraphs.length < 3) {
          const divRegex = /<div[^>]*class="[^"]*(?:article|content|body|text|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
          let dm;
          while ((dm = divRegex.exec(contentHtml)) !== null) {
            const innerP = dm[1].replace(/<[^>]+>/g, '').trim();
            if (innerP.length > 50) paragraphs.push(innerP);
          }
        }

        const body = paragraphs.slice(0, 20).join('\n\n');
        if (!body || body.length < 100) {
          skipped.push(article.title);
          continue;
        }

        const slugBase = article.title
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 60);
        const slug = `${slugBase || 'article'}-${Date.now().toString(36)}`;

        // Pick category
        let category = 'NEWS';
        if (article.title.includes('ديزل') || article.title.includes('بنزين') || article.title.includes('وقود') || article.title.includes('محروقات') || article.title.includes('بترول') || article.title.includes('نفط') || article.title.includes('محطة')) {
          category = 'FUEL_PRICES';
        } else if (article.title.includes('جمرك') || article.title.includes('تسجيل') || article.title.includes('ترخيص') || article.title.includes('ضريبة') || article.title.includes('استيراد')) {
          category = 'CUSTOMS';
        } else if (article.title.includes('مراجعة') || article.title.includes('تجربة') || article.title.includes('اختبار')) {
          category = 'REVIEWS';
        }

        const excerpt = body.slice(0, 300) + '...';
        const content = `${body}\n\n---\n*المصدر: [رؤيا](${article.url})*`;

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

        created.push({ title: newArticle.title, slug: newArticle.slug });
      } catch {
        skipped.push(article.title);
      }
    }

    return successResponse({
      message: `تم استيراد ${created.length} مقال من رؤيا، تخطي ${skipped.length}`,
      created,
      skipped,
    });
  } catch (error) {
    return errorResponse('فشل جلب الأخبار: ' + (error as Error).message, 500);
  }
}
