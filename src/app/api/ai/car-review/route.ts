import { NextResponse } from 'next/server';
import { generateReview } from '@/ai/review-generator';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-review:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'تم تجاوز الحد المسموح' }, { status: 429 });
    }

    const { text, brand, model, year } = await request.json();

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'النص قصير جداً. اكتب تجربتك بالتفصيل (10 أحرف على الأقل)' },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: 'النص طويل جداً. اكتب مراجعة مختصرة (2000 حرف كحد أقصى)' },
        { status: 400 }
      );
    }

    const result = generateReview(text, { brand, model, year });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'خطأ في توليد المراجعة' },
      { status: 500 }
    );
  }
}
