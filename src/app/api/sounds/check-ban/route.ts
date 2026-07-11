import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return successResponse({ isBanned: false });
    }

    const now = new Date();
    
    const activeBan = await prisma.soundBan.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (activeBan) {
      return successResponse({
        isBanned: true,
        ban: {
          reason: activeBan.reason,
          message: activeBan.message,
          duration: activeBan.duration,
          expiresAt: activeBan.expiresAt
        }
      });
    }

    return successResponse({ isBanned: false });
  } catch (error) {
    console.error('Error checking sound ban:', error);
    return errorResponse('فشل في التحقق من الحظر', 500);
  }
}
