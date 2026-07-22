import { NextRequest } from 'next/server';
import { getMarketPrices } from '@/lib/market-scrape';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-market:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) {
      return Response.json({ success: false, error: 'تم تجاوز الحد المسموح' }, { status: 429 });
    }

    const { brand, model, year, kilometers, condition } = await request.json();

    if (!brand || !year) {
      return Response.json({
        success: false,
        error: 'الرجاء إدخال الماركة وسنة الصنع على الأقل',
      }, { status: 400 });
    }

    const yearNum = parseInt(year);
    const kmNum = parseInt(kilometers) || 0;

    const result = await getMarketPrices(brand, model || '', yearNum, kmNum, condition || 'GOOD');

    return Response.json({
      success: true,
      data: {
        query: { brand, model: model || '', year: yearNum, kilometers: kmNum, condition: condition || '' },
        stats: {
          totalListings: result.stats.count,
          priceRange: {
            min: result.stats.min || result.dbPrices.min,
            max: result.stats.max || result.dbPrices.max,
            avg: result.stats.avg || result.dbPrices.avg,
            median: result.stats.median || result.dbPrices.median,
          },
          estimatedPrice: result.estimatedPrice,
          pricePosition: result.priceLabel,
          conditionAdjustment: 0,
          sources: result.stats.sources,
        },
        trend: { direction: 'من مصادر متعددة', percent: 0, emoji: '🌐' },
        similarCars: result.webPrices.map(p => ({
          id: p.url,
          slug: '',
          title: p.title,
          price: p.price,
          year: p.year,
          kilometers: p.km,
          condition: '',
          image: null,
          city: p.location,
          source: p.source,
          url: p.url,
        })),
      },
    });
  } catch {
    return Response.json({
      success: false,
      error: 'عذراً، حدث خطأ أثناء تحليل السوق. حاول مرة أخرى.',
    }, { status: 500 });
  }
}
