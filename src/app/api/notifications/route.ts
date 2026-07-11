import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return successResponse({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return errorResponse('فشل تحميل الإشعارات', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return successResponse({ message: 'تم تحديث الإشعارات' });
  } catch (error) {
    console.error('Notifications update error:', error);
    return errorResponse('فشل تحديث الإشعارات', 500);
  }
}
