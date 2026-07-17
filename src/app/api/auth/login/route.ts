import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api';
import { checkRateLimit, RATE_LIMITS, resetRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip')
      || 'unknown';

    const rateLimitKey = `login:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.LOGIN);
    if (!rateLimit.allowed) {
      return errorResponse(`تم تجاوز الحد المسموح. حاول مرة أخرى بعد ${rateLimit.resetIn} ثانية`, 429);
    }

    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { email, password } = validation.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse('البريد الإلكتروني أو كلمة المرور غير صحيحة');

    if (!user.isActive) return errorResponse('الحساب موقوف، تواصل مع الإدارة');

    const lockedUntil = (user as any).lockedUntil;
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000);
      return errorResponse(`الحساب مقفل مؤقتاً. حاول بعد ${minutesLeft} دقيقة`);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      const failedAttempts = ((user as any).failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.failedLoginAttempts = 0;
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData });
      return errorResponse('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    resetRateLimit(rateLimitKey);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const response = successResponse({
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        image: user.image, phone: user.phone, whatsapp: user.whatsapp,
        whatsappNotifications: user.whatsappNotifications, dealerName: user.dealerName,
        bio: user.bio, dealerDescription: user.dealerDescription, dealerAddress: user.dealerAddress,
        rating: user.rating, ratingCount: user.ratingCount,
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
