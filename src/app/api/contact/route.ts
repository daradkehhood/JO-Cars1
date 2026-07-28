import { NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizePlainText } from '@/lib/sanitize';

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`contact:${ip}`, RATE_LIMITS.CONTACT);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز الحد المسموح، حاول لاحقاً' }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
    }
    if (name.length > 100 || email.length > 200 || (subject && subject.length > 200) || message.length > 5000) {
      return NextResponse.json({ success: false, error: 'البيانات المدخلة طويلة جداً' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
    }

    console.log('Contact form submission:', { name: sanitizePlainText(name), email, subject: subject ? sanitizePlainText(subject) : undefined, message: sanitizePlainText(message) });

    return NextResponse.json({ success: true, message: 'تم استلام رسالتك بنجاح' });
  } catch (error) {
    console.error('Contact form error');
    return NextResponse.json({ success: false, error: 'حدث خطأ في معالجة الرسالة' }, { status: 500 });
  }
}
