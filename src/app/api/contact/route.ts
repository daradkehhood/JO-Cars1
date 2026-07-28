import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    console.log('Contact form submission:', { name, email, subject, message });

    return NextResponse.json({
      success: true,
      message: 'تم استلام رسالتك بنجاح',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في معالجة الرسالة' },
      { status: 500 }
    );
  }
}
