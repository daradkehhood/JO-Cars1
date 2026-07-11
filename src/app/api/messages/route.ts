import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { messageSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { sendWhatsApp, buildCarMessage } from '@/lib/whatsapp';
import { notifyAdmins, getAdminNotifyLink } from '@/lib/admin-notify';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
        receiver: { select: { id: true, name: true, image: true, role: true } },
        car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return successResponse(messages);
  } catch (error) {
    return errorResponse('فشل تحميل الرسائل', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validation = messageSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const msgData: Record<string, unknown> = {
      content: validation.data.content,
      senderId: user.id,
      receiverId: validation.data.receiverId,
      carId: validation.data.carId,
    };

    if (body.conversationId) {
      msgData.conversationId = body.conversationId;
    }

    const message = await prisma.message.create({
      data: msgData as {
        content: string;
        senderId: string;
        receiverId: string;
        carId?: string;
        conversationId?: string;
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        car: { select: { id: true, slug: true } },
      },
    });

    if (body.conversationId) {
      await prisma.conversation.update({
        where: { id: body.conversationId },
        data: { updatedAt: new Date() },
      });
    }

    await prisma.notification.create({
      data: {
        type: 'NEW_MESSAGE',
        title: 'رسالة جديدة',
        message: `لديك رسالة جديدة من ${user.name}`,
        userId: validation.data.receiverId,
        link: `/messages?conversationId=${body.conversationId || ''}`,
      },
    });

    const receiver = await prisma.user.findUnique({
      where: { id: validation.data.receiverId },
      select: { whatsapp: true, whatsappNotifications: true, name: true },
    });

    if (receiver?.whatsapp && receiver?.whatsappNotifications) {
      const car = message.carId ? await prisma.car.findUnique({
        where: { id: message.carId! },
        select: { price: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } }, year: true },
      }) : null;

      const carTitle = car ? `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}` : '';

      sendWhatsApp(receiver.whatsapp, buildCarMessage('new_message', {
        senderName: user.name,
        carTitle,
        carPrice: car?.price,
        messagePreview: validation.data.content.slice(0, 100),
        carUrl: message.car?.slug,
      }));
    }

    notifyAdmins('NEW_MESSAGE', 'رسالة جديدة', `رسالة جديدة من ${user.name}: ${validation.data.content.slice(0, 80)}...`, getAdminNotifyLink('NEW_MESSAGE'));

    return successResponse(message, 201);
  } catch (error) {
    return errorResponse('فشل إرسال الرسالة', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return errorResponse('معرّف المحادثة مطلوب');
    }

    await prisma.message.updateMany({
      where: { conversationId, receiverId: user.id, read: false },
      data: { read: true },
    });

    return successResponse({ updated: true });
  } catch (error) {
    return errorResponse('فشل تحديث الرسائل', 500);
  }
}
