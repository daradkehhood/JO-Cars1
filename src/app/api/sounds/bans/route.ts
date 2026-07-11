import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return unauthorizedResponse();

    if (user.role !== 'ADMIN') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { userId, reason, message, duration, reportId } = body;

    if (!userId || !reason || !duration) {
      return errorResponse('المستخدم والسبب والمدة مطلوبة');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return notFoundResponse('المستخدم');

    let expiresAt: Date | null = null;
    const now = new Date();

    switch (duration) {
      case '1hour':
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case '2days':
        expiresAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        break;
      case '1week':
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case '2weeks':
        expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case '1month':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'permanent':
        expiresAt = null;
        break;
      default:
        return errorResponse('مدة غير صحيحة');
    }

    const ban = await prisma.soundBan.create({
      data: {
        userId,
        bannedBy: user.id,
        reason,
        message: message || null,
        duration,
        expiresAt,
        isActive: true
      }
    });

    if (reportId) {
      await prisma.soundReport.update({
        where: { id: reportId },
        data: { status: 'resolved', reviewedBy: user.id, reviewedAt: new Date() }
      });
    }

    return successResponse(ban, 201);
  } catch (error) {
    console.error('Error creating sound ban:', error);
    return errorResponse('فشل في حظر المستخدم', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return unauthorizedResponse();

    if (user.role !== 'ADMIN') {
      return unauthorizedResponse();
    }

    const bans = await prisma.soundBan.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        banner: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const activeBans = bans.filter(ban => {
      if (!ban.isActive) return false;
      if (!ban.expiresAt) return true;
      return new Date(ban.expiresAt) > now;
    });

    return successResponse(activeBans);
  } catch (error) {
    console.error('Error fetching sound bans:', error);
    return errorResponse('فشل في جلب الحظرات', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return unauthorizedResponse();

    if (user.role !== 'ADMIN') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const banId = searchParams.get('id');

    if (!banId) {
      return errorResponse('معرف الحظر مطلوب');
    }

    await prisma.soundBan.update({
      where: { id: banId },
      data: { isActive: false }
    });

    return successResponse({ message: 'تم رفع الحظر بنجاح' });
  } catch (error) {
    console.error('Error removing sound ban:', error);
    return errorResponse('فشل في رفع الحظر', 500);
  }
}
