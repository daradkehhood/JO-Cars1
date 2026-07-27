import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api';
import { notifyAdmins, getAdminNotifyLink } from '@/lib/admin-notify';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { isIPBlocked, blockIP, trackSuspiciousActivity } from '@/lib/ip-blacklist';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip')
      || 'unknown';

    if (isIPBlocked(ip)) {
      return errorResponse('تم حظر عنوان IP الخاص بك مؤقتاً', 403);
    }

    const rateLimitKey = `register:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.REGISTER);
    if (!rateLimit.allowed) {
      if (trackSuspiciousActivity(ip)) {
        blockIP(ip, 'Excessive registration attempts');
      }
      return errorResponse('تم تجاوز الحد المسموح', 429);
    }

    const body = await request.json();

    // Honeypot check
    if (body.website || body.honeypot) {
      return successResponse({ message: 'تم التسجيل بنجاح' }, 201);
    }

    const validation = registerSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const {
      name, email, password, phone, role,
      dealerName, dealerDescription, dealerAddress, dealerLogo, commercialReg,
    } = validation.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse('البريد الإلكتروني مستخدم بالفعل');

    const isTrader = role === 'TRADER';
    // حساب التاجر يُسجّل دخوله مباشرةً مع role='TRADER' و dealerVerified=false
    // (الافتراضي). لم نعد نضع طلب اعتماد معلّق (TraderVerification PENDING):
    // المستخدم طلب صراحةً أن يتم التسجيل "بشكل طبيعي عادي بدون موافقه".
    // إن أرادت الإدارة تفعيل dealerVerified لاحقًا تتم عبر صفحة /admin/users
    // (تُرقّي المستخدم وتضبط dealerVerified=true) أو تبقى تجارة معلّقة.
    const finalRole = isTrader ? 'TRADER' : (role || 'USER');

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name, email, password: hashedPassword, phone,
          role: finalRole, dealerName, lastLoginAt: new Date(), lastLoginIp: ip,
          // حفظ حقول ملف التاجر فورًا كي يُعرَض الاسم في صفحة الإدارة
          // (dealerVerified يبقى false — يحتاج اعتمادًا اختياريًا).
          ...(isTrader ? {
            dealerDescription, dealerAddress, dealerLogo,
            dealerCommercialReg: commercialReg,
          } : {}),
        },
        select: {
          id: true, name: true, email: true, role: true, image: true,
          phone: true, whatsapp: true, whatsappNotifications: true,
          dealerName: true, dealerVerified: true,
        },
      });

      // لم نعد ننشئ صف TraderVerification PENDING هنا — راجع التعليق أعلاه.

      return user;
    });

    notifyAdmins(
      isTrader ? 'NEW_TRADER' : 'NEW_USER',
      isTrader ? 'تاجر جديد سجّل' : 'مستخدم جديد',
      isTrader
        ? `تاجر جديد سجّل بنفسه: ${result.name} (${result.email}) — يحتاج اعتماد الإدارة لتفعيل استقبال الحجوزات`
        : `مستخدم جديد سجل: ${result.name} (${result.email})`,
      getAdminNotifyLink(isTrader ? 'NEW_TRADER' : 'NEW_USER'),
    );

    const token = signToken({ userId: result.id, email: result.email, role: result.role });
    const response = successResponse({ user: result, token }, 201);
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('حدث خطأ', 500);
  }
}
