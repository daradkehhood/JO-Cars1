import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendWhatsApp } from '@/lib/whatsapp';

// Temporary memory store for OTP codes (phone -> { code, expiresAt })
export const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`otp:${ip}`, { windowMs: 60 * 1000, maxRequests: 3 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز حد طلبات الرموز. حاول بعد دقيقة' }, { status: 429 });
    }

    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'رقم الهاتف مطلوب' }, { status: 400 });
    }

    const cleanedPhone = phone.replace(/[^0-9+]/g, '');
    const isJordanPhone = /^(?:\+?962|0)?7[789]\d{7}$/.test(cleanedPhone);

    if (!isJordanPhone) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال رقم هاتف أردني صحيح (+962 7X XXXXXXX)' }, { status: 400 });
    }

    let formattedPhone = cleanedPhone;
    if (formattedPhone.startsWith('0')) formattedPhone = '+962' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(formattedPhone, { code, expiresAt });

    const message = `🔒 *رمز التحقق الخاص بك في منصة JO Cars*\n\nالرمز: *${code}*\n\nينتهي خلال 5 دقائق. لا تشارك هذا الرمز مع أي شخص.`;
    await sendWhatsApp(formattedPhone, message);

    console.log(`[OTP] Sent OTP ${code} to ${formattedPhone}`);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق بنجاح إلى رقم الهاتف',
      phone: formattedPhone,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ success: false, error: 'فشل إرسال رمز التحقق' }, { status: 500 });
  }
}
