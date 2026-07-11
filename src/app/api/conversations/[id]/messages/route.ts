import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { buyerId: true, sellerId: true },
    });

    if (!conversation) {
      return errorResponse('المحادثة غير موجودة', 404);
    }

    const isParticipant =
      conversation.buyerId === user.id ||
      conversation.sellerId === user.id;

    if (!isParticipant && user.role !== 'ADMIN') {
      return errorResponse('غير مصرح لك بالوصول إلى هذه المحادثة', 403);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (user.role !== 'ADMIN') {
      await prisma.message.updateMany({
        where: { conversationId: id, receiverId: user.id, read: false },
        data: { read: true },
      });
    }

    return successResponse(messages);
  } catch (error) {
    return errorResponse('فشل تحميل الرسائل', 500);
  }
}
