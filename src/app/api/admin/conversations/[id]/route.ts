import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
        buyer: { select: { id: true, name: true, image: true } },
        seller: { select: { id: true, name: true, image: true } },
      },
    });
    if (!conversation) return notFoundResponse('المحادثة');

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: { sender: { select: { id: true, name: true, image: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse({ conversation, messages });
  } catch (error) {
    return errorResponse('فشل تحميل المحادثة', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return notFoundResponse('المحادثة');

    const message = await prisma.message.create({
      data: {
        content: body.content,
        senderId: user.id,
        receiverId: conversation.buyerId,
        carId: conversation.carId,
        conversationId: conversation.id,
      },
      include: { sender: { select: { id: true, name: true, image: true, role: true } } },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    await prisma.notification.create({
      data: {
        type: 'NEW_MESSAGE',
        title: 'رسالة من الإدارة',
        message: `رسالة جديدة من الإدارة: ${body.content?.slice(0, 100)}`,
        userId: conversation.buyerId,
        link: `/messages?conversationId=${conversation.id}`,
      },
    });

    return successResponse(message, 201);
  } catch (error) {
    return errorResponse('فشل إرسال الرسالة', 500);
  }
}
