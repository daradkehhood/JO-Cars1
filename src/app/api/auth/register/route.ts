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
    // TRADER accounts start unverified — admin must approve the linked
    // TraderVerification row before the dealer can act as a trader.
    const finalRole = isTrader ? 'TRADER' : (role || 'USER');

    const hashedPassword = await hashPassword(password);

    // Use a transaction so a TRADER registration either creates BOTH the
    // User and the verification request, or neither (no orphan accounts).
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name, email, password: hashedPassword, phone,
          role: finalRole, dealerName, lastLoginAt: new Date(), lastLoginIp: ip,
          // Persist dealer profile fields up-front so the admin approval
          // queue can preview them immediately.
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

      if (isTrader) {
        await tx.traderVerification.create({
          data: {
            userId: user.id,
            status: 'PENDING',
            dealerName: dealerName || name,
            dealerDescription: dealerDescription || null,
            dealerAddress: dealerAddress || null,
            dealerLogo: dealerLogo || null,
            commercialReg: commercialReg || null,
          },
        });
      }

      return user;
    });

    notifyAdmins(
      isTrader ? 'NEW_TRADER' : 'NEW_USER',
      isTrader ? 'طلب اعتماد تاجر جديد' : 'مستخدم جديد',
      isTrader
        ? `تاجر جديد سجل وينتظر الاعتماد: ${result.name} (${result.email})`
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
