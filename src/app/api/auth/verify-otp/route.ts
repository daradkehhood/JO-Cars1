import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { otpStore } from '../send-otp/route';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'رقم الهاتف والرمز مطلوبان' }, { status: 400 });
    }

    let formattedPhone = phone.replace(/[^0-9+]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '+962' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;

    const record = otpStore.get(formattedPhone);

    if (!record) {
      return NextResponse.json({ success: false, error: 'لم يتم العثور على رمز تحقق صالح لهذا الرقم' }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(formattedPhone);
      return NextResponse.json({ success: false, error: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد' }, { status: 400 });
    }

    if (record.code !== code.trim()) {
      return NextResponse.json({ success: false, error: 'رمز التحقق غير صحيح' }, { status: 400 });
    }

    // Success! Update user phone & phoneVerified status in DB
    otpStore.delete(formattedPhone);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: formattedPhone,
        whatsapp: formattedPhone,
        phoneVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم التوثيق بنجاح! تم ربط رقم الهاتف وتأكيده لحسابك',
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ success: false, error: 'فشل التحقق من الرمز' }, { status: 500 });
  }
}
