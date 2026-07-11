import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { email, password } = validation.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse('البريد الإلكتروني أو كلمة المرور غير صحيحة');

    const valid = await verifyPassword(password, user.password);
    if (!valid) return errorResponse('البريد الإلكتروني أو كلمة المرور غير صحيحة');

    if (!user.isActive) return errorResponse('الحساب موقوف، تواصل مع الإدارة');

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip')
      || 'unknown';

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const response = successResponse({
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        image: user.image, phone: user.phone, whatsapp: user.whatsapp,
        whatsappNotifications: user.whatsappNotifications, dealerName: user.dealerName,
      },
      token,
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('حدث خطأ في تسجيل الدخول', 500);
  }
}
