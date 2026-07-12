import { NextResponse } from 'next/server';
import { generateReview } from '@/ai/review-generator';

export async function POST(request: Request) {
  try {
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
