import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api';
import { notifyAdmins, getAdminNotifyLink } from '@/lib/admin-notify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { name, email, password, phone, role, dealerName } = validation.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse('البريد الإلكتروني مستخدم بالفعل');

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip')
      || 'unknown';

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone, role, dealerName, lastLoginAt: new Date(), lastLoginIp: ip },
      select: { id: true, name: true, email: true, role: true, image: true, phone: true, whatsapp: true, whatsappNotifications: true, dealerName: true },
    });

    notifyAdmins('NEW_USER', 'مستخدم جديد', `مستخدم جديد سجل: ${user.name} (${user.email})`, getAdminNotifyLink('NEW_USER'));

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const response = successResponse({ user, token }, 201);
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('حدث خطأ في إنشاء الحساب', 500);
  }
}
